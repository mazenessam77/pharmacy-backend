# ============================================================
# ecs.tf — ECS cluster (Fargate), log groups, task defs, services
#
#   3 web services (auth/orders/pharmacy) behind the ALB
#   1 async worker consuming SQS
# All tasks run in private subnets across both AZs.
# ============================================================

resource "aws_ecs_cluster" "main" {
  name = local.name # => pharmalink-production

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = local.name }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    base              = 1
    weight            = 1
  }
}

# ─── CloudWatch Log Groups (one per task) ─────────────────────
resource "aws_cloudwatch_log_group" "this" {
  for_each = toset(local.task_names)

  name              = "/ecs/${local.name}/${each.value}"
  retention_in_days = var.log_retention_days

  tags = { Service = each.value }
}

# ─── Container env / secrets (assembled per task) ─────────────
locals {
  # Shared, non-secret config injected into every task.
  base_env = {
    NODE_ENV       = var.environment
    AWS_REGION     = var.aws_region
    REDIS_HOST     = aws_elasticache_replication_group.redis.primary_endpoint_address
    REDIS_PORT     = "6379"
    SESSIONS_TABLE = aws_dynamodb_table.sessions.name
    SQS_QUEUE_URL  = aws_sqs_queue.work.url
  }

  # Per-task environment: base + the task's own database coordinates.
  container_env = {
    for t in local.task_names : t => merge(
      local.base_env,
      {
        SERVICE_NAME = t
        DB_HOST      = aws_db_instance.this[local.task_db[t]].address
        DB_PORT      = tostring(local.databases[local.task_db[t]].port)
        DB_NAME      = var.db_name
        DB_USER      = var.db_master_username
      },
      t == "worker"
      ? { SQS_DLQ_URL = aws_sqs_queue.dlq.url }
      : { PORT = tostring(var.container_port) },
    )
  }

  # Per-task secrets pulled from SSM SecureString at container start.
  container_secrets = {
    for t in local.task_names : t => [
      { name = "DB_PASSWORD", valueFrom = aws_ssm_parameter.db_password[local.task_db[t]].arn },
      { name = "REDIS_AUTH_TOKEN", valueFrom = aws_ssm_parameter.redis_auth_token.arn },
    ]
  }
}

# ─── Task definitions: web services ───────────────────────────
resource "aws_ecs_task_definition" "service" {
  for_each = local.services

  family                   = "${local.name}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = local.task_role_arns[each.key]

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name      = each.key
    image     = var.container_images[each.key]
    essential = true

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = [for k, v in local.container_env[each.key] : { name = k, value = v }]
    secrets     = local.container_secrets[each.key]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.this[each.key].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = each.key
      }
    }
  }])

  tags = { Service = each.key }
}

# ─── Task definition: async worker ────────────────────────────
resource "aws_ecs_task_definition" "worker" {
  family                   = "${local.name}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = local.task_role_arns["worker"]

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name        = "worker"
    image       = var.container_images["worker"]
    essential   = true
    environment = [for k, v in local.container_env["worker"] : { name = k, value = v }]
    secrets     = local.container_secrets["worker"]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.this["worker"].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "worker"
      }
    }
  }])

  tags = { Service = "worker" }
}

# ─── Services: web (behind the ALB) ───────────────────────────
resource "aws_ecs_service" "service" {
  for_each = local.services

  name            = "${local.name}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.service[each.key].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [for s in aws_subnet.private : s.id]
    security_groups  = [aws_security_group.ecs_service[each.key].id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.service[each.key].arn
    container_name   = each.key
    container_port   = var.container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # Give new tasks time to pass health checks before old ones drain.
  health_check_grace_period_seconds = 60

  depends_on = [aws_lb_listener.https]

  lifecycle {
    ignore_changes = [desired_count] # owned by Application Auto Scaling
  }

  tags = { Service = each.key }
}

# ─── Service: async worker (no load balancer) ─────────────────
resource "aws_ecs_service" "worker" {
  name            = "${local.name}-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = var.worker_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [for s in aws_subnet.private : s.id]
    security_groups  = [aws_security_group.worker.id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = { Service = "worker" }
}

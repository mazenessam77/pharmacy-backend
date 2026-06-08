# ============================================================
# ecs.tf — ECS cluster (Fargate), log groups, task defs, services
#
#   backend  : Express monolith (Mongo + Redis), behind /api + /socket.io
#   frontend : Next.js app, behind everything else
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

resource "aws_cloudwatch_log_group" "this" {
  for_each = local.services

  name              = "/ecs/${local.name}/${each.key}"
  retention_in_days = var.log_retention_days

  tags = { Service = each.key }
}

# ─── Per-service env / secrets ────────────────────────────────
locals {
  backend_env = {
    NODE_ENV           = var.environment
    PORT               = tostring(var.backend_container_port)
    AWS_REGION         = var.aws_region
    FRONTEND_URL       = "https://${var.domain}"
    GROQ_MODEL         = var.groq_model
    GOOGLE_CLIENT_ID   = var.google_client_id
    JWT_ACCESS_EXPIRY  = "15m"
    JWT_REFRESH_EXPIRY = "7d"
  }

  frontend_env = {
    NODE_ENV = var.environment
    PORT     = tostring(var.frontend_container_port)
    HOSTNAME = "0.0.0.0"
  }

  container_env = {
    backend  = local.backend_env
    frontend = local.frontend_env
  }

  container_secrets = {
    backend = [
      { name = "MONGODB_URI", valueFrom = aws_ssm_parameter.mongodb_uri.arn },
      { name = "REDIS_URL", valueFrom = aws_ssm_parameter.redis_url.arn },
      { name = "JWT_ACCESS_SECRET", valueFrom = aws_ssm_parameter.jwt_access.arn },
      { name = "JWT_REFRESH_SECRET", valueFrom = aws_ssm_parameter.jwt_refresh.arn },
      { name = "GROQ_API_KEY", valueFrom = aws_ssm_parameter.groq_api_key.arn },
      { name = "CLOUDINARY_CLOUD_NAME", valueFrom = aws_ssm_parameter.cloudinary_cloud_name.arn },
      { name = "CLOUDINARY_API_KEY", valueFrom = aws_ssm_parameter.cloudinary_api_key.arn },
      { name = "CLOUDINARY_API_SECRET", valueFrom = aws_ssm_parameter.cloudinary_api_secret.arn },
    ]
    frontend = []
  }

  task_cpu    = { backend = var.backend_cpu, frontend = var.frontend_cpu }
  task_memory = { backend = var.backend_memory, frontend = var.frontend_memory }
}

# ─── Task definitions ─────────────────────────────────────────
resource "aws_ecs_task_definition" "service" {
  for_each = local.services

  family                   = "${local.name}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = local.task_cpu[each.key]
  memory                   = local.task_memory[each.key]
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name      = each.key
    image     = var.container_images[each.key]
    essential = true

    portMappings = [{
      containerPort = each.value.container_port
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

# ─── Services ─────────────────────────────────────────────────
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
    container_port   = each.value.container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  health_check_grace_period_seconds = 60

  depends_on = [aws_lb_listener.https]

  lifecycle {
    ignore_changes = [desired_count] # owned by Application Auto Scaling
  }

  tags = { Service = each.key }
}

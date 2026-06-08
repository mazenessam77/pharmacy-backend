# ============================================================
# ssm.tf — SSM Parameter Store: DB credentials + core config
#
# Secrets (passwords, auth token) are SecureString and injected
# into containers via the ECS task definition `secrets` block.
# Endpoints/config are plain String parameters for app discovery.
# ============================================================

# ─── Per-database credentials ─────────────────────────────────
resource "aws_ssm_parameter" "db_host" {
  for_each = local.databases
  name     = "${local.ssm_prefix}/db/${each.key}/host"
  type     = "String"
  value    = aws_db_instance.this[each.key].address
  tags     = { Service = each.key }
}

resource "aws_ssm_parameter" "db_port" {
  for_each = local.databases
  name     = "${local.ssm_prefix}/db/${each.key}/port"
  type     = "String"
  value    = tostring(each.value.port)
  tags     = { Service = each.key }
}

resource "aws_ssm_parameter" "db_name" {
  for_each = local.databases
  name     = "${local.ssm_prefix}/db/${each.key}/name"
  type     = "String"
  value    = var.db_name
  tags     = { Service = each.key }
}

resource "aws_ssm_parameter" "db_username" {
  for_each = local.databases
  name     = "${local.ssm_prefix}/db/${each.key}/username"
  type     = "String"
  value    = var.db_master_username
  tags     = { Service = each.key }
}

resource "aws_ssm_parameter" "db_password" {
  for_each = local.databases
  name     = "${local.ssm_prefix}/db/${each.key}/password"
  type     = "SecureString"
  value    = random_password.db[each.key].result
  tags     = { Service = each.key }
}

# ─── Core configuration ───────────────────────────────────────
resource "aws_ssm_parameter" "redis_host" {
  name  = "${local.ssm_prefix}/redis/host"
  type  = "String"
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

resource "aws_ssm_parameter" "redis_port" {
  name  = "${local.ssm_prefix}/redis/port"
  type  = "String"
  value = "6379"
}

resource "aws_ssm_parameter" "redis_auth_token" {
  name  = "${local.ssm_prefix}/redis/auth_token"
  type  = "SecureString"
  value = random_password.redis.result
}

resource "aws_ssm_parameter" "sqs_queue_url" {
  name  = "${local.ssm_prefix}/sqs/queue_url"
  type  = "String"
  value = aws_sqs_queue.work.url
}

resource "aws_ssm_parameter" "sqs_dlq_url" {
  name  = "${local.ssm_prefix}/sqs/dlq_url"
  type  = "String"
  value = aws_sqs_queue.dlq.url
}

resource "aws_ssm_parameter" "dynamodb_sessions_table" {
  name  = "${local.ssm_prefix}/dynamodb/sessions_table"
  type  = "String"
  value = aws_dynamodb_table.sessions.name
}

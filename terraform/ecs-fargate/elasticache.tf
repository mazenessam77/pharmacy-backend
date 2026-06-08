# ============================================================
# elasticache.tf — shared Redis cache (private subnets)
#
# Encryption in transit + at rest with an auth token. The token
# is URL-safe so it embeds in REDIS_URL (rediss://:token@host).
# ============================================================

resource "aws_elasticache_subnet_group" "main" {
  name        = "${local.name}-redis-subnets"
  description = "Private subnets for ElastiCache Redis"
  subnet_ids  = [for s in aws_subnet.private : s.id]
}

# AUTH token — 16-128 chars; URL-safe set so it works inside REDIS_URL.
resource "random_password" "redis" {
  length           = 48
  special          = true
  override_special = "-_~"
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.name}-redis"
  description          = "PharmaLink shared cache"

  engine         = "redis"
  engine_version = var.redis_engine_version
  node_type      = var.redis_node_type
  port           = 6379

  num_cache_clusters         = var.redis_num_nodes
  automatic_failover_enabled = var.redis_num_nodes > 1
  multi_az_enabled           = var.redis_num_nodes > 1

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis.result

  snapshot_retention_limit = 5
  apply_immediately        = false

  tags = { Name = "${local.name}-redis" }
}

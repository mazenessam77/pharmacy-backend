# ============================================================
# elasticache.tf — shared Redis cache (private subnets)
#
# Replication group with encryption in transit + at rest and an
# auth token. >=2 nodes enables automatic failover (Multi-AZ).
# ============================================================

resource "aws_elasticache_subnet_group" "main" {
  name        = "${local.name}-redis-subnets"
  description = "Private subnets for ElastiCache Redis"
  subnet_ids  = [for s in aws_subnet.private : s.id]
}

# AUTH token — Redis requires 16-128 chars; keep the special set safe.
resource "random_password" "redis" {
  length           = 32
  special          = true
  override_special = "!&#$^<>-"
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

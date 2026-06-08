# ============================================================
# outputs.tf
# ============================================================

# ─── Networking ───────────────────────────────────────────────
output "vpc_id" {
  description = "VPC id."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet ids (ALB / NAT)."
  value       = [for s in aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  description = "Private subnet ids (ECS / RDS / Redis)."
  value       = [for s in aws_subnet.private : s.id]
}

# ─── Edge / ALB ───────────────────────────────────────────────
output "alb_dns_name" {
  description = "Point your Cloudflare CNAME (proxied / orange cloud) at this."
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone id (for alias records, if ever needed)."
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ALB ARN."
  value       = aws_lb.main.arn
}

output "cloudflare_origin_target" {
  description = "DNS setup: CNAME mymedcine.com -> this host, proxied, SSL = Full (strict)."
  value       = "CNAME mymedcine.com -> ${aws_lb.main.dns_name} (Cloudflare proxied / orange cloud)"
}

output "cloudflare_allowlist_ipv4" {
  description = "Resolved Cloudflare IPv4 ranges allowed to reach the ALB."
  value       = local.cloudflare_ipv4
}

output "cloudflare_allowlist_ipv6" {
  description = "Resolved Cloudflare IPv6 ranges allowed to reach the ALB."
  value       = local.cloudflare_ipv6
}

# ─── Compute ──────────────────────────────────────────────────
output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN."
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_names" {
  description = "All ECS service names."
  value = concat(
    [for s in aws_ecs_service.service : s.name],
    [aws_ecs_service.worker.name],
  )
}

# ─── Data layer ───────────────────────────────────────────────
output "rds_endpoints" {
  description = "Database-per-service RDS hostnames (service => address)."
  value       = { for k, db in aws_db_instance.this : k => db.address }
}

output "rds_ports" {
  description = "RDS ports (service => port)."
  value       = { for k, db in aws_db_instance.this : k => db.port }
}

output "redis_primary_endpoint" {
  description = "ElastiCache Redis primary endpoint."
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "sqs_queue_url" {
  description = "Work queue URL."
  value       = aws_sqs_queue.work.url
}

output "sqs_queue_arn" {
  description = "Work queue ARN."
  value       = aws_sqs_queue.work.arn
}

output "sqs_dlq_url" {
  description = "Dead-letter queue URL."
  value       = aws_sqs_queue.dlq.url
}

output "dynamodb_sessions_table" {
  description = "DynamoDB session/state table name."
  value       = aws_dynamodb_table.sessions.name
}

# ─── Config ───────────────────────────────────────────────────
output "ssm_parameter_prefix" {
  description = "SSM Parameter Store prefix holding DB credentials and config."
  value       = local.ssm_prefix
}

output "ecr_repository_urls" {
  description = "ECR repository URL per service (use these in container_images)."
  value       = { for k, r in aws_ecr_repository.this : k => r.repository_url }
}

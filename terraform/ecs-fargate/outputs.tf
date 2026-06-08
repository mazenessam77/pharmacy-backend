# ============================================================
# outputs.tf
# ============================================================

output "vpc_id" {
  description = "VPC id."
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet ids (ECS / DocumentDB / Redis)."
  value       = [for s in aws_subnet.private : s.id]
}

# ─── Edge / ALB ───────────────────────────────────────────────
output "alb_dns_name" {
  description = "Point your Cloudflare CNAME (proxied) at this."
  value       = aws_lb.main.dns_name
}

output "cloudflare_origin_target" {
  description = "DNS: CNAME <domain> -> this host, proxied, SSL = Full (strict)."
  value       = "CNAME ${var.domain} -> ${aws_lb.main.dns_name} (Cloudflare proxied)"
}

output "cloudflare_allowlist_ipv4" {
  description = "Cloudflare IPv4 ranges allowed to reach the ALB."
  value       = local.cloudflare_ipv4
}

# ─── Compute ──────────────────────────────────────────────────
output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_names" {
  description = "ECS service names."
  value       = { for k, s in aws_ecs_service.service : k => s.name }
}

output "ecr_repository_urls" {
  description = "ECR repository URL per service (use these in container_images)."
  value       = { for k, r in aws_ecr_repository.this : k => r.repository_url }
}

# ─── Data layer ───────────────────────────────────────────────
output "documentdb_endpoint" {
  description = "DocumentDB cluster endpoint (host for MONGODB_URI)."
  value       = aws_docdb_cluster.main.endpoint
}

output "documentdb_reader_endpoint" {
  description = "DocumentDB reader endpoint."
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "redis_primary_endpoint" {
  description = "ElastiCache Redis primary endpoint."
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

# ─── Config ───────────────────────────────────────────────────
output "ssm_parameter_prefix" {
  description = "SSM prefix holding connection strings + secrets (set the CHANGEME ones)."
  value       = local.ssm_prefix
}

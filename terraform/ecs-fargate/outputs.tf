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

# ─── DNS / Route 53 ───────────────────────────────────────────
output "route53_name_servers" {
  description = "Set THESE 4 NS records at your domain registrar for mymedcine.com."
  value       = aws_route53_zone.main.name_servers
}

output "route53_zone_id" {
  description = "Route 53 hosted zone id."
  value       = aws_route53_zone.main.zone_id
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN (auto-validated via Route 53)."
  value       = aws_acm_certificate.main.arn
}

output "site_url" {
  description = "Public URL once the registrar NS are updated."
  value       = "https://${var.domain}"
}

# ─── ALB ──────────────────────────────────────────────────────
output "alb_dns_name" {
  description = "ALB DNS name (Route 53 apex/www alias targets point here)."
  value       = aws_lb.main.dns_name
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

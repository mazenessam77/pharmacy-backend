# ============================================================
# security.tf — security groups
#
#   Cloudflare ─443─▶ ALB ─▶ backend:5000 / frontend:3000
#   backend ─27017─▶ DocumentDB
#   backend ─6379──▶ Redis
# ============================================================

# ─── ALB: HTTPS from Cloudflare edge ranges ONLY ──────────────
resource "aws_security_group" "alb" {
  name        = "${local.name}-alb-sg"
  description = "ALB ingress restricted to Cloudflare edge (HTTPS only)"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "HTTPS from Cloudflare"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = local.cloudflare_ipv4
    ipv6_cidr_blocks = local.cloudflare_ipv6
  }

  egress {
    description = "All outbound (to ECS tasks)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-alb-sg" }
}

# ─── ECS services (backend + frontend): ingress from ALB only ─
resource "aws_security_group" "ecs_service" {
  for_each = local.services

  name        = "${local.name}-${each.key}-sg"
  description = "Fargate tasks for the ${each.key} service"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App traffic from the ALB"
    from_port       = each.value.container_port
    to_port         = each.value.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound (DocumentDB, Redis, ECR/SSM via NAT)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-${each.key}-sg" }
}

# ─── DocumentDB: only from the backend ────────────────────────
resource "aws_security_group" "docdb" {
  name        = "${local.name}-docdb-sg"
  description = "DocumentDB (MongoDB) — backend only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MongoDB wire protocol from backend"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_service["backend"].id]
  }

  tags = { Name = "${local.name}-docdb-sg" }
}

# ─── ElastiCache Redis: only from the backend ─────────────────
resource "aws_security_group" "redis" {
  name        = "${local.name}-redis-sg"
  description = "ElastiCache Redis — backend only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis from backend"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_service["backend"].id]
  }

  tags = { Name = "${local.name}-redis-sg" }
}

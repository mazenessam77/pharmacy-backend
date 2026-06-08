# ============================================================
# security.tf — security groups
#
# Ingress chain:
#   Cloudflare ──443──▶ ALB ──container_port──▶ ECS services
#   ECS services ──5432/3306──▶ their own RDS (database-per-service)
#   ECS services + worker ──6379──▶ Redis
# Each RDS only accepts traffic from its owning service's SG.
# ============================================================

# ─── ALB: HTTPS from Cloudflare edge ranges ONLY ──────────────
resource "aws_security_group" "alb" {
  name        = "${local.name}-alb-sg"
  description = "ALB ingress restricted to Cloudflare edge (HTTPS only)"
  vpc_id      = aws_vpc.main.id

  # No port 80: Cloudflare (Full strict) origin-pulls on 443, and the
  # ALB uses an ACM cert — there is no ACME challenge on the origin.
  ingress {
    description      = "HTTPS from Cloudflare (IPv4)"
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

# ─── ECS web services: ingress only from the ALB ──────────────
resource "aws_security_group" "ecs_service" {
  for_each = local.services

  name        = "${local.name}-${each.key}-sg"
  description = "Fargate tasks for the ${each.key} service"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App traffic from the ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound (DB, Redis, SQS, ECR via NAT)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-${each.key}-sg" }
}

# ─── Async worker: no inbound; outbound only ──────────────────
resource "aws_security_group" "worker" {
  name        = "${local.name}-worker-sg"
  description = "Fargate tasks for the async SQS worker"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "All outbound (SQS, pharmacy DB, Redis, ECR via NAT)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-worker-sg" }
}

# ─── Per-database security groups (database-per-service) ──────
# auth_db ← auth service only
resource "aws_security_group" "db_auth" {
  name        = "${local.name}-auth-db-sg"
  description = "auth_db (PostgreSQL) — auth service only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from auth service"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_service["auth"].id]
  }

  tags = { Name = "${local.name}-auth-db-sg" }
}

# orders_db ← orders service only
resource "aws_security_group" "db_orders" {
  name        = "${local.name}-orders-db-sg"
  description = "orders_db (PostgreSQL) — orders service only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from orders service"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_service["orders"].id]
  }

  tags = { Name = "${local.name}-orders-db-sg" }
}

# pharmacy_db ← pharmacy service AND the async worker (writes results)
resource "aws_security_group" "db_pharmacy" {
  name        = "${local.name}-pharmacy-db-sg"
  description = "pharmacy_db (MySQL) — pharmacy service + worker"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "MySQL from pharmacy service and worker"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    security_groups = [
      aws_security_group.ecs_service["pharmacy"].id,
      aws_security_group.worker.id,
    ]
  }

  tags = { Name = "${local.name}-pharmacy-db-sg" }
}

# ─── ElastiCache (Redis): shared by all services + worker ─────
resource "aws_security_group" "redis" {
  name        = "${local.name}-redis-sg"
  description = "ElastiCache Redis — services and worker"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Redis from services and worker"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = concat(
      [for s in aws_security_group.ecs_service : s.id],
      [aws_security_group.worker.id],
    )
  }

  tags = { Name = "${local.name}-redis-sg" }
}

# Map: database key -> its security group id (used by rds.tf)
locals {
  db_security_group_ids = {
    auth     = aws_security_group.db_auth.id
    orders   = aws_security_group.db_orders.id
    pharmacy = aws_security_group.db_pharmacy.id
  }
}

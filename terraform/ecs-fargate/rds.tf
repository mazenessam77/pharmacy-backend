# ============================================================
# rds.tf — database-per-service (3 isolated RDS instances)
#
#   auth_db     → PostgreSQL (Multi-AZ)
#   orders_db   → PostgreSQL (Multi-AZ)
#   pharmacy_db → MySQL      (Multi-AZ)
#
# Each lives in the private subnets and only accepts traffic
# from its owning service's security group (see security.tf).
# Master passwords are generated, never hardcoded, and stored
# in SSM Parameter Store (see ssm.tf).
# ============================================================

resource "aws_db_subnet_group" "main" {
  name        = "${local.name}-db-subnets"
  description = "Private subnets for all RDS instances"
  subnet_ids  = [for s in aws_subnet.private : s.id]

  tags = { Name = "${local.name}-db-subnets" }
}

# Generated master password per database
resource "random_password" "db" {
  for_each = local.databases

  length  = 24
  special = true
  # Exclude characters RDS disallows in master passwords
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_instance" "this" {
  for_each = local.databases

  identifier     = "${local.name}-${each.key}-db"
  engine         = each.value.engine
  engine_version = each.value.engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_master_username
  password = random_password.db[each.key].result
  port     = each.value.port

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [local.db_security_group_ids[each.key]]
  multi_az               = var.db_multi_az
  publicly_accessible    = false

  backup_retention_period      = var.db_backup_retention
  copy_tags_to_snapshot        = true
  auto_minor_version_upgrade   = true
  performance_insights_enabled = true
  deletion_protection          = var.enable_deletion_protection
  apply_immediately            = var.rds_apply_immediately

  skip_final_snapshot       = var.rds_skip_final_snapshot
  final_snapshot_identifier = var.rds_skip_final_snapshot ? null : "${local.name}-${each.key}-final"

  tags = {
    Name    = "${local.name}-${each.key}-db"
    Service = each.key
    Engine  = each.value.engine
  }
}

# ============================================================
# docdb.tf — Amazon DocumentDB (MongoDB-compatible) for the app
#
# Private subnets, TLS on (default), encrypted, reachable only
# from the backend service. The connection string is assembled
# in ssm.tf and injected into the backend as a secret.
#
# NOTE (app side): the backend image must trust the Amazon
# DocumentDB CA bundle (global-bundle.pem) and connect with
# retryWrites=false — see README / runbook.
# ============================================================

resource "aws_docdb_subnet_group" "main" {
  name        = "${local.name}-docdb-subnets"
  description = "Private subnets for DocumentDB"
  subnet_ids  = [for s in aws_subnet.private : s.id]

  tags = { Name = "${local.name}-docdb-subnets" }
}

# Master password — generated, URL-safe (embedded in MONGODB_URI).
resource "random_password" "docdb" {
  length           = 32
  special          = true
  override_special = "-_~."
}

resource "aws_docdb_cluster" "main" {
  cluster_identifier = "${local.name}-docdb"
  engine             = "docdb"
  engine_version     = var.docdb_engine_version

  master_username = var.docdb_master_username
  master_password = random_password.docdb.result

  db_subnet_group_name   = aws_docdb_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.docdb.id]

  backup_retention_period = var.docdb_backup_retention
  preferred_backup_window = "03:00-04:00"
  storage_encrypted       = true
  deletion_protection     = var.enable_deletion_protection

  skip_final_snapshot       = var.docdb_skip_final_snapshot
  final_snapshot_identifier = var.docdb_skip_final_snapshot ? null : "${local.name}-docdb-final"

  tags = { Name = "${local.name}-docdb" }
}

resource "aws_docdb_cluster_instance" "main" {
  count = var.docdb_instance_count

  identifier         = "${local.name}-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.docdb_instance_class

  tags = { Name = "${local.name}-docdb-${count.index}" }
}

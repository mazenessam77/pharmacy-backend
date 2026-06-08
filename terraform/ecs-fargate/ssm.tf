# ============================================================
# ssm.tf — SSM Parameter Store: connection strings + secrets
#
# Connection strings (Mongo/Redis) and JWT secrets are generated
# here. External secrets (Groq, Cloudinary) are created as managed
# placeholders — set their real values in the SSM console; Terraform
# won't overwrite them (ignore_changes on value).
# ============================================================

locals {
  # DocumentDB connection string. tlsCAFile must exist in the backend
  # image (Amazon global-bundle.pem); retryWrites=false is required.
  mongodb_uri = "mongodb://${var.docdb_master_username}:${random_password.docdb.result}@${aws_docdb_cluster.main.endpoint}:27017/${var.mongo_db_name}?tls=true&tlsCAFile=/app/certs/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"

  # ioredis enables TLS automatically for the rediss:// scheme.
  redis_url = "rediss://:${random_password.redis.result}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
}

# ─── Generated JWT signing secrets ────────────────────────────
resource "random_password" "jwt_access" {
  length  = 48
  special = false
}

resource "random_password" "jwt_refresh" {
  length  = 48
  special = false
}

# ─── Connection strings + JWT (managed by Terraform) ──────────
resource "aws_ssm_parameter" "mongodb_uri" {
  name  = "${local.ssm_prefix}/MONGODB_URI"
  type  = "SecureString"
  value = local.mongodb_uri
}

resource "aws_ssm_parameter" "redis_url" {
  name  = "${local.ssm_prefix}/REDIS_URL"
  type  = "SecureString"
  value = local.redis_url
}

resource "aws_ssm_parameter" "jwt_access" {
  name  = "${local.ssm_prefix}/JWT_ACCESS_SECRET"
  type  = "SecureString"
  value = random_password.jwt_access.result
}

resource "aws_ssm_parameter" "jwt_refresh" {
  name  = "${local.ssm_prefix}/JWT_REFRESH_SECRET"
  type  = "SecureString"
  value = random_password.jwt_refresh.result
}

# ─── External secrets (placeholders — set real values in SSM) ─
resource "aws_ssm_parameter" "groq_api_key" {
  name  = "${local.ssm_prefix}/GROQ_API_KEY"
  type  = "SecureString"
  value = "CHANGEME"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "cloudinary_cloud_name" {
  name  = "${local.ssm_prefix}/CLOUDINARY_CLOUD_NAME"
  type  = "SecureString"
  value = "CHANGEME"
  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "cloudinary_api_key" {
  name  = "${local.ssm_prefix}/CLOUDINARY_API_KEY"
  type  = "SecureString"
  value = "CHANGEME"
  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "cloudinary_api_secret" {
  name  = "${local.ssm_prefix}/CLOUDINARY_API_SECRET"
  type  = "SecureString"
  value = "CHANGEME"
  lifecycle { ignore_changes = [value] }
}

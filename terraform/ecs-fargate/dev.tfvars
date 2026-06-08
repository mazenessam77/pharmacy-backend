# ============================================================
# dev.tfvars — cost-optimized, low-availability environment.
# Apply with:  terraform apply -var-file=dev.tfvars
#
# Note: the ALB and RDS subnet groups still require 2 AZs, so the
# network keeps both subnets — but uses a SINGLE NAT gateway and
# single-AZ data tiers, which is where the real cost lives.
# ============================================================

environment = "dev"

# ─── Networking: one shared NAT gateway (saves ~$32/mo) ───────
single_nat_gateway = true

# ─── Compute: minimal scaling (1 task each, low ceiling) ──────
desired_count        = 1
worker_desired_count = 1
min_capacity         = 1
max_capacity         = 2
task_cpu             = 256
task_memory          = 512
worker_cpu           = 256
worker_memory        = 512

# ─── RDS: single-AZ, smallest class, easy teardown ───────────
db_instance_class          = "db.t4g.micro"
db_multi_az                = false
db_backup_retention        = 1
enable_deletion_protection = false
rds_skip_final_snapshot    = true

# ─── Redis: single node (no replica / failover) ──────────────
redis_num_nodes = 1

# ─── REQUIRED ────────────────────────────────────────────────
# Issue an ACM cert (DNS-validated via Cloudflare) for the dev
# hostname, wait for ISSUED, then paste its ARN here.
certificate_arn = "arn:aws:acm:us-east-1:498341975421:certificate/REPLACE-ME"

# After `docker push` to ECR, point these at the repo URLs from
# `terraform output ecr_repository_urls`:
# container_images = {
#   auth     = "498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-auth:latest"
#   orders   = "498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-orders:latest"
#   pharmacy = "498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-pharmacy:latest"
#   worker   = "498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-worker:latest"
# }

# ============================================================
# dev.tfvars — cost-optimized, low-availability environment.
# Apply with:  terraform apply -var-file=dev.tfvars
# (2 AZs are still required by the ALB + DocumentDB; the savings
#  come from 1 NAT, single DocumentDB instance, 1 Redis node.)
# ============================================================

environment = "dev"

# Networking: one shared NAT gateway (saves ~$32/mo)
single_nat_gateway = true

# Compute: minimal scaling
desired_count   = 1
min_capacity    = 1
max_capacity    = 2
backend_cpu     = 256
backend_memory  = 512
frontend_cpu    = 256
frontend_memory = 512

# DocumentDB: single instance (db.t3.medium is the smallest), easy teardown
docdb_instance_class      = "db.t3.medium"
docdb_instance_count      = 1
docdb_skip_final_snapshot = true

# Redis: single node
redis_num_nodes = 1

# Easy teardown
enable_deletion_protection = false

# REQUIRED: issued ACM cert ARN for the dev hostname
certificate_arn = "arn:aws:acm:us-east-1:498341975421:certificate/REPLACE-ME"

# After pushing images (terraform output ecr_repository_urls):
# container_images = {
#   backend  = "498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-backend:latest"
#   frontend = "498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-frontend:latest"
# }

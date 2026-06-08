# ============================================================
# variables.tf — all tunable inputs (no hardcoded values)
# ============================================================

# ─── Core ─────────────────────────────────────────────────────
variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name, used as a resource name prefix."
  type        = string
  default     = "pharmalink"
}

variable "environment" {
  description = "Deployment environment (production, staging, ...)."
  type        = string
  default     = "production"
}

variable "tags" {
  description = "Extra tags merged into the provider default_tags."
  type        = map(string)
  default     = {}
}

# ─── Networking ───────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to span (must match the subnet CIDR list lengths)."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "Provide at least two AZs for Multi-AZ high availability."
  }
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs (ALB / NAT), one per AZ."
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs (ECS tasks / RDS / Redis), one per AZ."
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "single_nat_gateway" {
  description = "Run one shared NAT gateway instead of one per AZ (cheaper; use for dev)."
  type        = bool
  default     = false
}

# ─── Cloudflare allowlist override (optional) ─────────────────
variable "cloudflare_ipv4_cidrs" {
  description = "Override Cloudflare IPv4 ranges. Empty = fetch live from cloudflare.com/ips-v4."
  type        = list(string)
  default     = []
}

variable "cloudflare_ipv6_cidrs" {
  description = "Override Cloudflare IPv6 ranges. Empty = fetch live from cloudflare.com/ips-v6."
  type        = list(string)
  default     = []
}

# ─── ALB / TLS ────────────────────────────────────────────────
variable "certificate_arn" {
  description = <<-EOT
    ARN of an ISSUED ACM certificate for your domain, used on the ALB
    HTTPS listener. Create/validate it separately (DNS validation via
    Cloudflare) — see README. Must be ISSUED before apply.
  EOT
  type        = string
}

variable "alb_ssl_policy" {
  description = "ALB HTTPS listener TLS security policy."
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "health_check_path" {
  description = "Container health-check path used by the ALB target groups."
  type        = string
  default     = "/health"
}

variable "enable_deletion_protection" {
  description = "Deletion protection for the ALB and RDS instances."
  type        = bool
  default     = true
}

# ─── ECS / Fargate ────────────────────────────────────────────
variable "container_images" {
  description = <<-EOT
    Container image URI per task (auth/orders/pharmacy/worker).
    Replace the placeholders with your ECR image URIs before going live.
  EOT
  type        = map(string)
  default = {
    auth     = "public.ecr.aws/docker/library/nginx:stable"
    orders   = "public.ecr.aws/docker/library/nginx:stable"
    pharmacy = "public.ecr.aws/docker/library/nginx:stable"
    worker   = "public.ecr.aws/docker/library/nginx:stable"
  }
}

variable "container_port" {
  description = "Port the web service containers listen on."
  type        = number
  default     = 5000
}

variable "task_cpu" {
  description = "Fargate CPU units for web services (256 = 0.25 vCPU)."
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate memory (MiB) for web services."
  type        = number
  default     = 512
}

variable "worker_cpu" {
  description = "Fargate CPU units for the async worker."
  type        = number
  default     = 512
}

variable "worker_memory" {
  description = "Fargate memory (MiB) for the async worker."
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired task count per web service."
  type        = number
  default     = 2
}

variable "worker_desired_count" {
  description = "Desired task count for the worker."
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Autoscaling minimum tasks per service."
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Autoscaling maximum tasks per service."
  type        = number
  default     = 6
}

variable "autoscaling_cpu_target" {
  description = "Target average CPU %% for service autoscaling."
  type        = number
  default     = 60
}

variable "worker_backlog_target" {
  description = "Target SQS messages-visible the worker autoscaler holds the queue at."
  type        = number
  default     = 100
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention for container logs."
  type        = number
  default     = 30
}

# ─── RDS (database-per-service) ───────────────────────────────
variable "postgres_version" {
  description = "Major engine version for the PostgreSQL databases."
  type        = string
  default     = "16"
}

variable "mysql_version" {
  description = "Major engine version for the MySQL database."
  type        = string
  default     = "8.0"
}

variable "db_instance_class" {
  description = "Instance class for all RDS instances."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial RDS storage (GiB)."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Max RDS storage (GiB) for storage autoscaling."
  type        = number
  default     = 100
}

variable "db_master_username" {
  description = "Master username for all RDS instances."
  type        = string
  default     = "pharmaadmin"
}

variable "db_name" {
  description = "Initial database name created on each RDS instance."
  type        = string
  default     = "pharmalink"
}

variable "db_multi_az" {
  description = "Enable RDS Multi-AZ standby for each database."
  type        = bool
  default     = true
}

variable "db_backup_retention" {
  description = "Automated backup retention (days) for RDS."
  type        = number
  default     = 7
}

variable "rds_skip_final_snapshot" {
  description = "Skip final snapshot on RDS destroy (set true only for throwaway envs)."
  type        = bool
  default     = false
}

variable "rds_apply_immediately" {
  description = "Apply RDS changes immediately instead of in the maintenance window."
  type        = bool
  default     = false
}

# ─── ElastiCache (Redis) ──────────────────────────────────────
variable "redis_node_type" {
  description = "ElastiCache node type."
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_engine_version" {
  description = "Redis engine version."
  type        = string
  default     = "7.1"
}

variable "redis_num_nodes" {
  description = "Number of cache nodes (>=2 enables automatic failover / Multi-AZ)."
  type        = number
  default     = 2
}

# ─── SQS ──────────────────────────────────────────────────────
variable "sqs_visibility_timeout" {
  description = "Visibility timeout (seconds) for the work queue."
  type        = number
  default     = 60
}

variable "sqs_max_receive_count" {
  description = "Receives before a message is moved to the DLQ."
  type        = number
  default     = 5
}

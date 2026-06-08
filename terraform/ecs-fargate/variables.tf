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
  description = "Deployment environment (production, dev, ...)."
  type        = string
  default     = "production"
}

variable "domain" {
  description = "Public domain served via Cloudflare (used for FRONTEND_URL etc.)."
  type        = string
  default     = "mymedcine.com"
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
    error_message = "Provide at least two AZs (ALB and DocumentDB require it)."
  }
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs (ALB / NAT), one per AZ."
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs (ECS tasks / DocumentDB / Redis), one per AZ."
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
  description = "Override Cloudflare IPv4 ranges. Empty = fetch live."
  type        = list(string)
  default     = []
}

variable "cloudflare_ipv6_cidrs" {
  description = "Override Cloudflare IPv6 ranges. Empty = fetch live."
  type        = list(string)
  default     = []
}

# ─── ALB / TLS ────────────────────────────────────────────────
variable "certificate_arn" {
  description = "ARN of an ISSUED ACM cert for the domain (ALB HTTPS listener)."
  type        = string
}

variable "alb_ssl_policy" {
  description = "ALB HTTPS listener TLS security policy."
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "enable_deletion_protection" {
  description = "Deletion protection for the ALB and DocumentDB."
  type        = bool
  default     = true
}

# ─── ECS / Fargate ────────────────────────────────────────────
variable "container_images" {
  description = "Container image URI per service (backend/frontend). Replace placeholders with ECR URIs."
  type        = map(string)
  default = {
    backend  = "public.ecr.aws/docker/library/nginx:stable"
    frontend = "public.ecr.aws/docker/library/nginx:stable"
  }
}

variable "backend_container_port" {
  description = "Port the backend (Express) container listens on."
  type        = number
  default     = 5000
}

variable "frontend_container_port" {
  description = "Port the frontend (Next.js) container listens on."
  type        = number
  default     = 3000
}

variable "backend_cpu" {
  description = "Fargate CPU units for the backend (256 = 0.25 vCPU)."
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Fargate memory (MiB) for the backend (OCR is memory-heavy)."
  type        = number
  default     = 1024
}

variable "frontend_cpu" {
  description = "Fargate CPU units for the frontend."
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Fargate memory (MiB) for the frontend."
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired task count per service."
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

variable "log_retention_days" {
  description = "CloudWatch Logs retention for container logs."
  type        = number
  default     = 30
}

# ─── App config (non-secret) ──────────────────────────────────
variable "google_client_id" {
  description = "Google OAuth client ID (public; injected as backend env)."
  type        = string
  default     = "350366296907-uusg9qh2kh53r5kacjtp2kr7r0h4t7np.apps.googleusercontent.com"
}

variable "groq_model" {
  description = "Groq model id for the AI feature."
  type        = string
  default     = "llama-3.3-70b-versatile"
}

# ─── DocumentDB (MongoDB-compatible) ──────────────────────────
variable "docdb_instance_class" {
  description = "DocumentDB instance class (minimum db.t3.medium)."
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances (>=2 for HA across AZs)."
  type        = number
  default     = 2
}

variable "docdb_engine_version" {
  description = "DocumentDB engine version."
  type        = string
  default     = "5.0.0"
}

variable "docdb_master_username" {
  description = "DocumentDB master username."
  type        = string
  default     = "pharmaadmin"
}

variable "mongo_db_name" {
  description = "Application database name."
  type        = string
  default     = "pharma_db"
}

variable "docdb_backup_retention" {
  description = "DocumentDB automated backup retention (days)."
  type        = number
  default     = 7
}

variable "docdb_skip_final_snapshot" {
  description = "Skip final snapshot on DocumentDB destroy (true only for throwaway envs)."
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

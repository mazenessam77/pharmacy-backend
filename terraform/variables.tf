# ============================================================
# variables.tf — All input variables for Phase 1 infrastructure
# ============================================================

variable "aws_region" {
  description = "AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used to prefix all resource names"
  type        = string
  default     = "pharma"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "production"
}

# ─── Networking ───────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the single public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "AZ to place the public subnet in"
  type        = string
  default     = "us-east-1a"
}

# ─── Security ─────────────────────────────────────────────────

variable "ssh_allowed_cidr" {
  description = <<-EOT
    CIDR that is allowed to SSH into the instance.
    WARNING: 0.0.0.0/0 is open to the world — restrict this to
    your own IP in production (e.g. "203.0.113.5/32").
  EOT
  type        = string
  default     = "0.0.0.0/0"
}

# ─── Compute ──────────────────────────────────────────────────

variable "instance_type" {
  description = "EC2 instance type. t3.medium gives 2 vCPU / 4 GB RAM — required for Tesseract OCR"
  type        = string
  default     = "t3.medium"
}

variable "key_pair_name" {
  description = "Name of the existing EC2 Key Pair for SSH access (must already exist in AWS)"
  type        = string
  # No default — must be provided by the user
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB. 30 GB stays within Free Tier gp3 limits"
  type        = number
  default     = 30
}

# ─── App ──────────────────────────────────────────────────────

variable "github_repo_url" {
  description = "Full HTTPS URL of the GitHub repo (e.g. https://github.com/user/pharmacy-backend.git)"
  type        = string
}

variable "app_dir" {
  description = "Absolute path on the EC2 instance where the app will be cloned"
  type        = string
  default     = "/opt/pharma-app"
}

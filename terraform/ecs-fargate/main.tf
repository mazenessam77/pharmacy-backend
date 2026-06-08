# ============================================================
# main.tf — providers, data sources, shared locals
#
# Target architecture for PharmaLink: ECS Fargate microservices
# behind an ALB, with Cloudflare (proxied) as the only public edge.
# See README.md for the full picture and apply instructions.
# ============================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    http = {
      source  = "hashicorp/http"
      version = "~> 3.4"
    }
  }

  # ── Remote state (recommended) ─────────────────────────────
  # Create the bucket + lock table first, then uncomment + init.
  # backend "s3" {
  #   bucket         = "pharmalink-tfstate-<unique-suffix>"
  #   key            = "ecs-fargate/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "pharmalink-tflock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge({
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "Terraform"
      Component   = "ecs-fargate"
    }, var.tags)
  }
}

# ─── Live Cloudflare edge ranges (fetched at plan time) ───────
# Pulling these dynamically keeps the ALB allowlist current.
# Override with var.cloudflare_ipv4_cidrs / _ipv6_cidrs for
# air-gapped/offline plans.
data "http" "cloudflare_ipv4" {
  url = "https://www.cloudflare.com/ips-v4"
}

data "http" "cloudflare_ipv6" {
  url = "https://www.cloudflare.com/ips-v6"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  name = "${var.project}-${var.environment}" # e.g. pharmalink-production

  # AZ -> subnet CIDR maps (index-aligned with the *_subnet_cidrs vars)
  public_subnets = {
    for idx, az in var.availability_zones : az => var.public_subnet_cidrs[idx]
  }
  private_subnets = {
    for idx, az in var.availability_zones : az => var.private_subnet_cidrs[idx]
  }

  # Cloudflare allowlist (override wins, else live fetch)
  cloudflare_ipv4 = length(var.cloudflare_ipv4_cidrs) > 0 ? var.cloudflare_ipv4_cidrs : split("\n", trimspace(data.http.cloudflare_ipv4.response_body))
  cloudflare_ipv6 = length(var.cloudflare_ipv6_cidrs) > 0 ? var.cloudflare_ipv6_cidrs : split("\n", trimspace(data.http.cloudflare_ipv6.response_body))

  # ── Web microservices fronted by the ALB (path-based routing) ──
  services = {
    auth = {
      path_patterns = ["/api/v1/auth", "/api/v1/auth/*"]
      priority      = 10
    }
    orders = {
      path_patterns = ["/api/v1/orders", "/api/v1/orders/*"]
      priority      = 20
    }
    pharmacy = {
      path_patterns = ["/api/v1/pharmacies", "/api/v1/pharmacies/*"]
      priority      = 30
    }
  }

  # ── Database-per-service (isolated RDS instances) ──
  databases = {
    auth = {
      engine         = "postgres"
      engine_version = var.postgres_version
      port           = 5432
    }
    orders = {
      engine         = "postgres"
      engine_version = var.postgres_version
      port           = 5432
    }
    pharmacy = {
      engine         = "mysql"
      engine_version = var.mysql_version
      port           = 3306
    }
  }

  # All Fargate task groups (web services + async worker)
  task_names = concat(keys(local.services), ["worker"])

  # Which DB each task connects to (worker processes pharmacy workloads)
  task_db = {
    auth     = "auth"
    orders   = "orders"
    pharmacy = "pharmacy"
    worker   = "pharmacy"
  }

  ssm_prefix = "/${local.name}"
}

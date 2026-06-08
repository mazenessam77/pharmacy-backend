# ============================================================
# main.tf — providers, data sources, shared locals
#
# PharmaLink on ECS Fargate, adapted to the ACTUAL app:
#   - backend  : the Express monolith (all /api + socket.io)
#   - frontend : the Next.js app (everything else)
#   - MongoDB  : Amazon DocumentDB (Mongo-compatible)
#   - Redis    : Amazon ElastiCache
#   - edge     : Cloudflare (proxied) -> ALB
# (No RDS/SQS/DynamoDB — the app doesn't use them.)
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

  # backend "s3" { ... }   # recommended for shared/remote state
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
data "http" "cloudflare_ipv4" {
  url = "https://www.cloudflare.com/ips-v4"
}

data "http" "cloudflare_ipv6" {
  url = "https://www.cloudflare.com/ips-v6"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  name = "${var.project}-${var.environment}"

  public_subnets = {
    for idx, az in var.availability_zones : az => var.public_subnet_cidrs[idx]
  }
  private_subnets = {
    for idx, az in var.availability_zones : az => var.private_subnet_cidrs[idx]
  }

  cloudflare_ipv4 = length(var.cloudflare_ipv4_cidrs) > 0 ? var.cloudflare_ipv4_cidrs : split("\n", trimspace(data.http.cloudflare_ipv4.response_body))
  cloudflare_ipv6 = length(var.cloudflare_ipv6_cidrs) > 0 ? var.cloudflare_ipv6_cidrs : split("\n", trimspace(data.http.cloudflare_ipv6.response_body))

  # ── The two Fargate services that make up the app ──
  # backend is an ALB listener RULE (path-matched); frontend is the
  # default action (catch-all), mirroring the current nginx routing.
  services = {
    backend = {
      container_port    = var.backend_container_port
      health_check_path = "/health"
      is_default        = false
      path_patterns     = ["/api", "/api/*", "/socket.io", "/socket.io/*"]
      priority          = 10
    }
    frontend = {
      container_port    = var.frontend_container_port
      health_check_path = "/"
      is_default        = true
      path_patterns     = []
      priority          = 50
    }
  }

  ssm_prefix = "/${local.name}"
}

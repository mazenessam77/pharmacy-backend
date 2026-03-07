# ============================================================
# main.tf — AWS Provider, AMI, EC2 Instance, Elastic IP
# ============================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Remote State (RECOMMENDED for production) ──────────────
  # Uncomment the block below after creating an S3 bucket and
  # DynamoDB table for state locking. Run `terraform init` again.
  #
  # backend "s3" {
  #   bucket         = "pharma-terraform-state-<unique-suffix>"
  #   key            = "phase1/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "pharma-terraform-lock"
  # }
  #
  # By default Terraform uses LOCAL state (terraform.tfstate).
  # Add that file to .gitignore — it may contain secrets.
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ─── AMI: Latest Ubuntu 24.04 LTS ────────────────────────────
# Uses a data source so Terraform always picks the freshest AMI
# instead of hardcoding an AMI ID that will eventually be deprecated.

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (official Ubuntu publisher)

  filter {
    name   = "name"
    # ubuntu-noble = 24.04 LTS | change to ubuntu-jammy for 22.04
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# ─── EC2 Instance ─────────────────────────────────────────────
# t3.medium = 2 vCPU / 4 GB RAM (~$30/month on-demand in us-east-1)
# Required because Tesseract.js OCR is memory-intensive.
# Cost note: t3.micro (Free Tier) only has 1 GB RAM — too small.

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name               = var.key_pair_name

  # map_public_ip_on_launch is on the subnet, but the EIP below
  # provides a stable public IP that survives instance reboots.
  associate_public_ip_address = true

  # ─── Root EBS Volume ──────────────────────────────────────
  # 30 GB gp3 = max Free Tier eligible storage.
  # gp3 baseline: 3000 IOPS, 125 MB/s throughput — no extra charge.
  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gb
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-root-ebs"
    }
  }

  # ─── Bootstrap Script ─────────────────────────────────────
  # templatefile() substitutes ${app_dir} and ${github_repo_url}
  # variables into the shell script before passing it to EC2.
  user_data = templatefile("${path.module}/user_data.sh", {
    app_dir           = var.app_dir
    github_repo_url   = var.github_repo_url
  })

  # Replace instance if user_data changes (requires terraform apply)
  user_data_replace_on_change = false

  tags = {
    Name = "${var.project_name}-app-server"
  }

  lifecycle {
    # Prevent accidental destruction of the running server
    prevent_destroy = false # Set to true once live in production
  }
}

# ─── Elastic IP ───────────────────────────────────────────────
# A static public IP that stays the same across instance stop/start.
# Point your Cloudflare DNS A record to this address.
# Cost: FREE while associated to a running instance.
# Charged (~$0.005/hr) only if the instance is stopped — remember to
# release the EIP if you terminate the instance.

resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id

  tags = {
    Name = "${var.project_name}-eip"
  }

  # Ensure the IGW exists before allocating the EIP
  depends_on = [aws_internet_gateway.main]
}

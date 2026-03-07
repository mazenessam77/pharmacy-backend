# ============================================================
# network.tf — VPC, IGW, Public Subnet, Route Table
#
# Phase 1 cost decision: PUBLIC-ONLY architecture.
# No NAT Gateway (~$32/month) and no private subnets.
# All containers talk to each other on the Docker bridge
# network (pharma-network) and are NOT exposed to the internet
# individually — only Nginx on 80/443 is public.
# ============================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# ─── Internet Gateway ─────────────────────────────────────────

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
  }
}

# ─── Single Public Subnet ─────────────────────────────────────

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  # EC2 instances launched here will auto-get a public IP
  # (we also attach an EIP in main.tf for a stable address)
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet"
    Environment = var.environment
  }
}

# ─── Route Table ──────────────────────────────────────────────

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  # Default route: all internet-bound traffic goes through the IGW
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

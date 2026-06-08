# ============================================================
# network.tf — VPC, subnets (2 public / 2 private), IGW,
# NAT gateways, route tables, gateway endpoints
#
# NAT: one gateway per AZ by default; set single_nat_gateway=true
# (dev) to run a single shared gateway and cut cost.
# ============================================================

locals {
  # AZs that receive a NAT gateway (all of them, or just the first).
  nat_gateway_azs = var.single_nat_gateway ? slice(var.availability_zones, 0, 1) : var.availability_zones
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${local.name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name}-igw" }
}

# ─── Public subnets (ALB + NAT) ───────────────────────────────
resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name}-public-${each.key}"
    Tier = "public"
  }
}

# ─── Private subnets (ECS tasks, RDS, Redis) ──────────────────
resource "aws_subnet" "private" {
  for_each = local.private_subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = each.key

  tags = {
    Name = "${local.name}-private-${each.key}"
    Tier = "private"
  }
}

# ─── NAT gateways: one per AZ for high availability ───────────
resource "aws_eip" "nat" {
  for_each = toset(local.nat_gateway_azs)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = { Name = "${local.name}-nat-eip-${each.key}" }
}

resource "aws_nat_gateway" "main" {
  for_each = toset(local.nat_gateway_azs)

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id

  tags       = { Name = "${local.name}-nat-${each.key}" }
  depends_on = [aws_internet_gateway.main]
}

# ─── Route tables ─────────────────────────────────────────────
# Public: single table, default route to the IGW.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${local.name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# Private: one table per AZ, default route to that AZ's NAT gateway.
resource "aws_route_table" "private" {
  for_each = local.private_subnets

  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    # With a single NAT, every private subnet routes through the one
    # gateway in the first AZ; otherwise through its own AZ's gateway.
    nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.main[var.availability_zones[0]].id : aws_nat_gateway.main[each.key].id
  }

  tags = { Name = "${local.name}-private-rt-${each.key}" }
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

# ─── Gateway VPC endpoints (free) ─────────────────────────────
# Keep S3 (ECR image layers) and DynamoDB traffic on the AWS
# backbone instead of paying for it through the NAT gateways.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [for rt in aws_route_table.private : rt.id]

  tags = { Name = "${local.name}-s3-endpoint" }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [for rt in aws_route_table.private : rt.id]

  tags = { Name = "${local.name}-dynamodb-endpoint" }
}

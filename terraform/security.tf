# ============================================================
# security.tf — EC2 Security Group (Firewall)
#
# Exposed to internet: 22 (SSH), 80 (HTTP), 443 (HTTPS) only.
# Internal app ports (3000 Next.js, 5001 Express, 6379 Redis,
# 27017 MongoDB) are NOT opened here — they stay on the Docker
# bridge network and are only reachable from within the host.
# ============================================================

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Security group for the Pharma app EC2 instance"
  vpc_id      = aws_vpc.main.id

  # ─── Inbound ──────────────────────────────────────────────

  # SSH — restrict to your IP in production by setting
  # var.ssh_allowed_cidr = "YOUR.IP.ADDRESS/32"
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  # HTTP — open to all; Cloudflare sits in front in production
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    # Production note: restrict to Cloudflare IP ranges:
    # https://www.cloudflare.com/ips/
  }

  # HTTPS — open to all; Cloudflare terminates TLS in production
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # ─── Outbound ─────────────────────────────────────────────

  # Allow all outbound (needed for apt, Docker Hub pulls, Cloudinary, etc.)
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-ec2-sg"
    Environment = var.environment
  }
}

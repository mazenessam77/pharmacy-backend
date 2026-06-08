# ============================================================
# security.tf — EC2 Security Group (Firewall)
#
# Exposed to internet: 22 (SSH), 80 (HTTP), 443 (HTTPS) only.
# Internal app ports (3000 Next.js, 5001 Express, 6379 Redis,
# 27017 MongoDB) are NOT opened here — they stay on the Docker
# bridge network and are only reachable from within the host.
# ============================================================

# ─── Cloudflare origin allowlist ──────────────────────────────
# Public Cloudflare edge ranges. HTTPS (443) ingress is locked to
# these so attackers can't reach the origin directly and bypass
# the Cloudflare WAF. Port 80 stays open (see note below).
# Regenerate with:
#   curl https://www.cloudflare.com/ips-v4
#   curl https://www.cloudflare.com/ips-v6
# (last synced: 2026-06-08)
locals {
  cloudflare_ipv4 = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22",
  ]

  cloudflare_ipv6 = [
    "2400:cb00::/32",
    "2606:4700::/32",
    "2803:f800::/32",
    "2405:b500::/32",
    "2405:8100::/32",
    "2a06:98c0::/29",
    "2c0f:f248::/32",
  ]
}

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

  # HTTP — intentionally open to all. Port 80 only serves the
  # Let's Encrypt HTTP-01 ACME challenge (validated from Let's
  # Encrypt's servers, NOT Cloudflare — required during grey-cloud
  # first issuance) and a 301 redirect to HTTPS. Do NOT lock this
  # to Cloudflare or cert issuance/renewal will fail.
  ingress {
    description = "HTTP (ACME challenge + HTTPS redirect)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS — locked to Cloudflare edge ranges so the origin can't be
  # reached directly, bypassing the Cloudflare WAF. Cloudflare must
  # be proxying (orange cloud) with SSL mode "Full (strict)".
  ingress {
    description      = "HTTPS (Cloudflare origin only)"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = local.cloudflare_ipv4
    ipv6_cidr_blocks = local.cloudflare_ipv6
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

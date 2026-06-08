# ============================================================
# route53.tf — hosted zone + apex/www alias records → ALB
#
# After apply, copy the 4 name servers (output: route53_name_servers)
# into your domain registrar so the domain delegates to Route 53.
# ============================================================

resource "aws_route53_zone" "main" {
  name = var.domain

  tags = { Name = "${local.name}-zone" }
}

# Apex (mymedcine.com) — must be an ALIAS A (zone apex can't be a CNAME).
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# www.mymedcine.com — alias A to the same ALB.
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

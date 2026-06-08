# ============================================================
# alb.tf — Application Load Balancer + path-based routing
#
# Cloudflare (proxied) ─443─▶ ALB ─▶ target group per service:
#   /api/v1/auth*        ▶ auth
#   /api/v1/orders*      ▶ orders
#   /api/v1/pharmacies*  ▶ pharmacy
# ============================================================

resource "aws_lb" "main" {
  name               = "${local.name}-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = [for s in aws_subnet.public : s.id]
  security_groups    = [aws_security_group.alb.id]

  enable_deletion_protection = var.enable_deletion_protection
  drop_invalid_header_fields = true
  idle_timeout               = 60

  tags = { Name = "${local.name}-alb" }
}

# One IP target group per web service (Fargate awsvpc => target_type "ip")
resource "aws_lb_target_group" "service" {
  for_each = local.services

  # NB: ALB target-group names max 32 chars — keep prefix short.
  name        = "${local.name}-${each.key}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = { Name = "${local.name}-${each.key}-tg" }
}

# HTTPS listener — terminates the Cloudflare origin connection.
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = var.alb_ssl_policy
  certificate_arn   = var.certificate_arn

  # Unmatched paths get a clean 404 instead of hitting a service.
  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "application/json"
      message_body = "{\"error\":\"not_found\",\"message\":\"No route for this path\"}"
      status_code  = "404"
    }
  }
}

# Path-based routing rules
resource "aws_lb_listener_rule" "service" {
  for_each = local.services

  listener_arn = aws_lb_listener.https.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service[each.key].arn
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }
}

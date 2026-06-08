# ============================================================
# alb.tf — Application Load Balancer + routing
#
# Mirrors the current nginx behaviour:
#   /api/*, /socket.io/*  -> backend  (listener rule)
#   everything else       -> frontend (default action)
# ============================================================

locals {
  default_service = [for k, v in local.services : k if v.is_default][0]
  rule_services   = { for k, v in local.services : k => v if !v.is_default }
}

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

# One IP target group per service (Fargate awsvpc => target_type "ip").
resource "aws_lb_target_group" "service" {
  for_each = local.services

  # ALB target-group names max 32 chars.
  name        = "${local.name}-${each.key}"
  port        = each.value.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = each.value.health_check_path
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = { Name = "${local.name}-${each.key}" }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = var.alb_ssl_policy
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  # Catch-all -> frontend.
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service[local.default_service].arn
  }
}

# Path-matched rules (currently just the backend).
resource "aws_lb_listener_rule" "service" {
  for_each = local.rule_services

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

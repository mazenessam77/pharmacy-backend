# ============================================================
# ecr.tf — container registries for the PharmaLink services
#
# One repository per task: pharmalink-{auth,orders,pharmacy,worker}.
# Push images here, then set var.container_images to the repo URLs
# (see `terraform output ecr_repository_urls`).
# ============================================================

resource "aws_ecr_repository" "this" {
  for_each = toset(local.task_names)

  name                 = "${var.project}-${each.value}"
  image_tag_mutability = "MUTABLE"
  force_delete         = !var.enable_deletion_protection

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = { Service = each.value }
}

# Keep storage lean: expire untagged layers, cap tagged image history.
resource "aws_ecr_lifecycle_policy" "this" {
  for_each   = aws_ecr_repository.this
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 14 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only the last 20 tagged images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 20
        }
        action = { type = "expire" }
      },
    ]
  })
}

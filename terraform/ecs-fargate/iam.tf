# ============================================================
# iam.tf — ECS execution role + per-service task roles
#
# Execution role: pulls images, writes logs, reads SSM secrets.
# Task roles:     least-privilege per service (what the app code
#                 itself is allowed to call at runtime).
# ============================================================

data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ─── Execution role (shared by all task definitions) ──────────
resource "aws_iam_role" "execution" {
  name               = "${local.name}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Read only this project's SSM parameters + decrypt them.
data "aws_iam_policy_document" "execution_secrets" {
  statement {
    sid    = "ReadProjectParameters"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]
    resources = [
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_prefix}/*",
    ]
  }

  statement {
    sid       = "DecryptSecureStrings"
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.aws_region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "read-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

# ─── Task role: auth ──────────────────────────────────────────
# Owns session/state in DynamoDB.
resource "aws_iam_role" "task_auth" {
  name               = "${local.name}-task-auth"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "task_auth" {
  statement {
    sid    = "SessionsTable"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
      "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
    ]
    resources = [aws_dynamodb_table.sessions.arn]
  }
}

resource "aws_iam_role_policy" "task_auth" {
  name   = "auth-permissions"
  role   = aws_iam_role.task_auth.id
  policy = data.aws_iam_policy_document.task_auth.json
}

# ─── Task role: orders ────────────────────────────────────────
# Publishes jobs to SQS and reads/writes session state.
resource "aws_iam_role" "task_orders" {
  name               = "${local.name}-task-orders"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "task_orders" {
  statement {
    sid       = "PublishToWorkQueue"
    effect    = "Allow"
    actions   = ["sqs:SendMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl"]
    resources = [aws_sqs_queue.work.arn]
  }

  statement {
    sid    = "SessionsTable"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
      "dynamodb:DeleteItem", "dynamodb:Query",
    ]
    resources = [aws_dynamodb_table.sessions.arn]
  }
}

resource "aws_iam_role_policy" "task_orders" {
  name   = "orders-permissions"
  role   = aws_iam_role.task_orders.id
  policy = data.aws_iam_policy_document.task_orders.json
}

# ─── Task role: pharmacy ──────────────────────────────────────
# Publishes heavy jobs to SQS.
resource "aws_iam_role" "task_pharmacy" {
  name               = "${local.name}-task-pharmacy"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "task_pharmacy" {
  statement {
    sid       = "PublishToWorkQueue"
    effect    = "Allow"
    actions   = ["sqs:SendMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl"]
    resources = [aws_sqs_queue.work.arn]
  }
}

resource "aws_iam_role_policy" "task_pharmacy" {
  name   = "pharmacy-permissions"
  role   = aws_iam_role.task_pharmacy.id
  policy = data.aws_iam_policy_document.task_pharmacy.json
}

# ─── Task role: worker ────────────────────────────────────────
# Consumes from SQS (work + DLQ). DB writes are network-authorized.
resource "aws_iam_role" "task_worker" {
  name               = "${local.name}-task-worker"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "task_worker" {
  statement {
    sid    = "ConsumeWorkQueue"
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage", "sqs:DeleteMessage",
      "sqs:GetQueueAttributes", "sqs:ChangeMessageVisibility",
    ]
    resources = [aws_sqs_queue.work.arn, aws_sqs_queue.dlq.arn]
  }
}

resource "aws_iam_role_policy" "task_worker" {
  name   = "worker-permissions"
  role   = aws_iam_role.task_worker.id
  policy = data.aws_iam_policy_document.task_worker.json
}

# Map task name -> task role ARN (consumed by ecs.tf)
locals {
  task_role_arns = {
    auth     = aws_iam_role.task_auth.arn
    orders   = aws_iam_role.task_orders.arn
    pharmacy = aws_iam_role.task_pharmacy.arn
    worker   = aws_iam_role.task_worker.arn
  }
}

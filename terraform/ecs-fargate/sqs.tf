# ============================================================
# sqs.tf — async work queue + dead-letter queue
#
# Producers: orders + pharmacy services (sqs:SendMessage)
# Consumer:  async worker (receive/delete/changevisibility)
# ============================================================

# Dead-letter queue for messages that exceed max receives.
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project}-work-dlq"
  message_retention_seconds = 1209600 # 14 days
  sqs_managed_sse_enabled   = true

  tags = { Name = "${var.project}-work-dlq" }
}

resource "aws_sqs_queue" "work" {
  name                       = "${var.project}-work-queue"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = 345600 # 4 days
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = { Name = "${var.project}-work-queue" }
}

# Allow only the DLQ to receive from the main queue's redrive.
resource "aws_sqs_queue_redrive_allow_policy" "dlq" {
  queue_url = aws_sqs_queue.dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.work.arn]
  })
}

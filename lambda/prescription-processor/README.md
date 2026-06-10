# Prescription Processor (SQS → Lambda → MongoDB)

Consumes `{ patientId, s3Key, notes }` messages from the prescription queue and
marks the matching `prescriptions` document `status: "PROCESSED"`.

```
backend ──presigned URL──▶ patient ──upload──▶ S3
backend ──SendMessage──▶ SQS ──event source──▶ this Lambda ──updateOne──▶ MongoDB
                          └── after maxReceiveCount failures ──▶ DLQ
```

## Build

```bash
npm install
npm run package        # → function.zip
```

## Infra (one-time)

```bash
REGION=eu-west-2

# 1. DLQ + main queue (visibilityTimeout ≥ 6 × Lambda timeout per AWS guidance)
DLQ_ARN=$(aws sqs create-queue --region $REGION --queue-name prescription-processing-dlq \
  --query 'QueueUrl' --output text | xargs -I{} aws sqs get-queue-attributes --region $REGION \
  --queue-url {} --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)

aws sqs create-queue --region $REGION --queue-name prescription-processing \
  --attributes "{\"VisibilityTimeout\":\"180\",\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"$DLQ_ARN\\\",\\\"maxReceiveCount\\\":\\\"5\\\"}\"}"

# 2. Lambda (Node 20, 30s timeout, MONGODB_URI in env — use Secrets Manager in prod)
aws lambda create-function --region $REGION \
  --function-name prescription-processor \
  --runtime nodejs20.x --handler handler.handler \
  --zip-file fileb://function.zip \
  --timeout 30 --memory-size 256 \
  --role <LAMBDA_EXECUTION_ROLE_ARN> \
  --environment "Variables={MONGODB_URI=<uri>,MONGODB_DB=pharmalink}"

# 3. Event source mapping — ReportBatchItemFailures is REQUIRED for the
#    partial-batch failure handling in handler.ts to take effect.
aws lambda create-event-source-mapping --region $REGION \
  --function-name prescription-processor \
  --event-source-arn <MAIN_QUEUE_ARN> \
  --batch-size 10 \
  --maximum-batching-window-in-seconds 5 \
  --function-response-types ReportBatchItemFailures
```

The execution role needs `AWSLambdaBasicExecutionRole` (CloudWatch logs) +
`sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes` on the
queue. If MongoDB lives in a VPC (e.g. the EC2 box's `pharma-mongodb`), the
Lambda must be attached to that VPC/subnets with an SG allowed on 27017 —
MongoDB Atlas over public TLS needs no VPC config.

## Backend producer (the other half)

The Express backend enqueues after issuing the presigned upload URL:

```ts
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'; // SDK v3

const sqs = new SQSClient({ region: process.env.AWS_REGION });
await sqs.send(new SendMessageCommand({
  QueueUrl: process.env.PRESCRIPTION_QUEUE_URL,
  MessageBody: JSON.stringify({ patientId, s3Key, notes }),
}));
```

## Schema note

The current `Prescription` model stores `imageUrl` only. This async flow adds
`s3Key` (string, indexed), `status` (`UPLOADED` → `PROCESSED`), `processedAt`,
and optional `processingNotes` — add them to `src/models/Prescription.ts` when
wiring the producer, plus an index: `{ s3Key: 1 }` (the Lambda's filter).

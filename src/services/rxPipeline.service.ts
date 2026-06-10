import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../utils/constants';

/**
 * Producer side of the async prescription pipeline:
 *   presign (browser PUTs the image straight to S3)
 *   → complete (Prescription doc created, message enqueued)
 *   → SQS → prescription-processor Lambda marks it PROCESSED.
 *
 * Credentials come from the default provider chain — on prod that's the EC2
 * instance role (pharma-ec2-ssm) via IMDSv2; nothing is stored in .env.
 */

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const PRESIGN_TTL_SECONDS = 300; // 5 min to start the upload
const VIEW_TTL_SECONDS = 300;

// Module-level singletons — reused across requests (connection pooling).
const s3 = new S3Client({ region: env.AWS_REGION });
const sqs = new SQSClient({ region: env.AWS_REGION });

const assertConfigured = (): void => {
  if (!env.PRESCRIPTIONS_BUCKET || !env.PRESCRIPTION_QUEUE_URL) {
    throw new AppError(
      'Prescription uploads are not configured on this environment.',
      503,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
};

export const allowedContentTypes = Object.keys(ALLOWED_CONTENT_TYPES);

/**
 * Presigned PUT for a prescription image. The key is SERVER-generated and
 * namespaced to the patient — the client never chooses where it writes.
 */
export const presignPrescriptionUpload = async (
  patientId: string,
  contentType: string
): Promise<{ uploadUrl: string; s3Key: string }> => {
  assertConfigured();
  const ext = ALLOWED_CONTENT_TYPES[contentType];
  const s3Key = `prescriptions/${patientId}/${randomUUID()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: env.PRESCRIPTIONS_BUCKET, Key: s3Key, ContentType: contentType }),
    { expiresIn: PRESIGN_TTL_SECONDS }
  );
  return { uploadUrl, s3Key };
};

/** True if the object exists (i.e. the browser really finished its PUT). */
export const prescriptionObjectExists = async (s3Key: string): Promise<boolean> => {
  assertConfigured();
  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.PRESCRIPTIONS_BUCKET, Key: s3Key }));
    return true;
  } catch {
    return false;
  }
};

/** Short-lived GET URL for viewing an image in the private bucket. */
export const presignPrescriptionView = async (s3Key: string): Promise<string> => {
  assertConfigured();
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: env.PRESCRIPTIONS_BUCKET, Key: s3Key }),
    { expiresIn: VIEW_TTL_SECONDS }
  );
};

/** Enqueue the processing job for the Lambda consumer. */
export const enqueuePrescriptionProcessing = async (msg: {
  patientId: string;
  s3Key: string;
  notes?: string;
}): Promise<void> => {
  assertConfigured();
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: env.PRESCRIPTION_QUEUE_URL,
      MessageBody: JSON.stringify(msg),
    })
  );
};

import type {
  Context,
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from 'aws-lambda';
import { MongoClient, ObjectId } from 'mongodb';

/**
 * Prescription processor — consumes the prescription-processing SQS queue.
 *
 * Flow: backend issues a presigned S3 URL → patient uploads the image directly
 * to S3 → backend enqueues { patientId, s3Key, notes } → THIS Lambda marks the
 * prescription document PROCESSED.
 *
 * Failure model: partial batch responses (ReportBatchItemFailures). Each record
 * is processed independently; failed messageIds are returned in
 * `batchItemFailures`, so SQS retries ONLY those and acknowledges the rest.
 * After maxReceiveCount unsuccessful receives, SQS moves the message to the DLQ.
 *
 * ⚠ The event source mapping MUST set
 *     FunctionResponseTypes = ["ReportBatchItemFailures"]
 * — without it, the returned batchItemFailures are silently ignored and failed
 * messages get acknowledged (data loss). See lambda/prescription-processor/README.md.
 */

const { MONGODB_URI, MONGODB_DB = 'pharmalink' } = process.env;
if (!MONGODB_URI) {
  // Fail at init (cold start) rather than per-message — misconfiguration should
  // be loud and immediate, not generate thousands of DLQ entries.
  throw new Error('MONGODB_URI environment variable is required');
}

// ── Connection initialised OUTSIDE the handler ─────────────────────────────
// One MongoClient per Lambda container, created on cold start and reused by
// every subsequent (warm) invocation. A Lambda container only ever runs ONE
// invocation at a time, so a small pool is correct: a large pool would just
// multiply idle connections across hundreds of concurrently scaled containers
// and exhaust the database's connection limit.
const client = new MongoClient(MONGODB_URI, {
  maxPoolSize: 2,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 5_000,
});
// Kick off the connect immediately so the TCP/TLS handshake happens during the
// cold start, not on the first record. connect() is idempotent and the driver
// auto-reconnects, so awaiting this promise in the handler is always safe.
const clientPromise = client.connect();

interface PrescriptionMessage {
  patientId: string;
  s3Key: string;
  notes?: string;
}

/** Parse + validate one SQS record body. Throws on malformed input. */
function parseMessage(record: SQSRecord): PrescriptionMessage {
  const body = JSON.parse(record.body) as Partial<PrescriptionMessage>;
  if (typeof body?.patientId !== 'string' || typeof body?.s3Key !== 'string') {
    throw new Error('message body must contain string fields "patientId" and "s3Key"');
  }
  // String-coerce before anything reaches a query document (same NoSQL-operator
  // hygiene as the API controllers), and let ObjectId validate patientId.
  return {
    patientId: String(body.patientId),
    s3Key: String(body.s3Key),
    notes: body.notes === undefined ? undefined : String(body.notes),
  };
}

export const handler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
  // Tell the runtime not to wait for the event loop to drain: the cached Mongo
  // client keeps sockets open between invocations by design.
  context.callbackWaitsForEmptyEventLoop = false;

  const db = (await clientPromise).db(MONGODB_DB);
  const prescriptions = db.collection('prescriptions');

  const batchItemFailures: SQSBatchItemFailure[] = [];

  // Sequential loop: records in one batch are processed independently, and a
  // failure in one must not affect the others. (Could be Promise.allSettled for
  // throughput, but sequential keeps DB pressure per container predictable.)
  for (const record of event.Records) {
    try {
      const msg = parseMessage(record);

      // Idempotent status update — SQS standard queues are at-least-once, so a
      // redelivered message simply re-sets the same status. Scoped to the
      // patient so a forged/mismatched patientId can never touch another
      // patient's prescription.
      const result = await prescriptions.updateOne(
        { s3Key: msg.s3Key, patientId: new ObjectId(msg.patientId) },
        {
          $set: {
            status: 'PROCESSED',
            processedAt: new Date(),
            ...(msg.notes !== undefined && { processingNotes: msg.notes }),
          },
        }
      );

      if (result.matchedCount === 0) {
        // No matching document — most often the consumer raced ahead of the
        // producer's DB write. Treat as retryable: SQS redelivers with backoff,
        // and if it never matches it lands in the DLQ for inspection.
        throw new Error(`no prescription matched s3Key=${msg.s3Key} for patient=${msg.patientId}`);
      }

      console.log(
        JSON.stringify({
          level: 'info',
          msg: 'prescription marked PROCESSED',
          messageId: record.messageId,
          s3Key: msg.s3Key,
        })
      );
    } catch (err) {
      // One bad message must not poison the batch: record it for retry/DLQ and
      // keep going. (Never log the full body — prescriptions are medical data.)
      console.error(
        JSON.stringify({
          level: 'error',
          msg: 'prescription message failed',
          messageId: record.messageId,
          error: err instanceof Error ? err.message : String(err),
        })
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  // Empty array = whole batch succeeded. Non-empty = SQS retries only these.
  return { batchItemFailures };
};

import { Types } from 'mongoose';
import { z } from 'zod';
import { AppError } from './AppError';
import { ERROR_CODES } from './constants';

/**
 * Strict MongoDB ObjectId guard — the single sanitizer for any user-controlled
 * identifier that reaches a query (NoSQL-injection defence).
 *
 * `z.string()` rejects non-strings, so objects/arrays and operator payloads like
 * `{ $ne: null }` or `{ $gt: '' }` can never pass. The 24-hex regex then rejects
 * empty / malformed / non-ObjectId strings. Missing values fail `z.string()`.
 */
export const objectIdSchema = z
  .string({ invalid_type_error: 'Invalid id', required_error: 'Invalid id' })
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

/** Type-narrowing predicate — true only for a valid 24-hex ObjectId string. */
export function isValidObjectId(value: unknown): value is string {
  return objectIdSchema.safeParse(value).success;
}

/**
 * Validate a user-controlled value and return a real `Types.ObjectId`. Queries
 * should receive THIS (an ObjectId), never the raw request value — that both
 * sanitizes the taint and fails fast (400) on anything that isn't an ObjectId.
 */
export function toObjectId(value: unknown): Types.ObjectId {
  const result = objectIdSchema.safeParse(value);
  if (!result.success) {
    throw new AppError('Invalid identifier.', 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return new Types.ObjectId(result.data);
}

import { Types } from 'mongoose';
import { objectIdSchema, isValidObjectId, toObjectId } from '../utils/objectId';
import { assignDriverSchema, orderIdParamSchema } from '../validations/delivery.validation';
import { AppError } from '../utils/AppError';

const VALID = '507f1f77bcf86cd799439011';

describe('ObjectId sanitizer (NoSQL-injection defence)', () => {
  describe('isValidObjectId', () => {
    it('accepts a valid 24-hex ObjectId', () => {
      expect(isValidObjectId(VALID)).toBe(true);
      expect(objectIdSchema.safeParse(VALID).success).toBe(true);
    });

    it.each([
      ['non-hex string', 'not-an-object-id'],
      ['too short', '123'],
      ['25 chars', `${VALID}a`],
      ['empty string', ''],
      ['hex with space', `${VALID.slice(0, 23)} `],
    ])('rejects invalid string: %s', (_label, value) => {
      expect(isValidObjectId(value)).toBe(false);
    });

    it.each([
      ['$ne operator injection', { $ne: null }],
      ['$gt operator injection', { $gt: '' }],
      ['nested object', { a: { b: 1 } }],
      ['array injection', [VALID]],
      ['array of operators', [{ $ne: null }]],
      ['undefined (missing)', undefined],
      ['null', null],
      ['number', 123],
      ['boolean', true],
    ])('rejects non-string injection: %s', (_label, value) => {
      expect(isValidObjectId(value as unknown)).toBe(false);
    });
  });

  describe('toObjectId', () => {
    it('returns a real Types.ObjectId for a valid id', () => {
      const oid = toObjectId(VALID);
      expect(oid).toBeInstanceOf(Types.ObjectId);
      expect(oid.toString()).toBe(VALID);
    });

    it.each([
      ['$ne operator injection', { $ne: null }],
      ['array injection', [VALID]],
      ['empty string', ''],
      ['invalid string', 'xyz'],
      ['undefined (missing)', undefined],
      ['null', null],
    ])('throws AppError 400 for %s', (_label, value) => {
      expect(() => toObjectId(value as unknown)).toThrow(AppError);
      try {
        toObjectId(value as unknown);
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
      }
    });
  });

  describe('delivery schemas reject injection at the boundary', () => {
    it('assignDriverSchema accepts a valid driverId', () => {
      expect(assignDriverSchema.safeParse({ driverId: VALID }).success).toBe(true);
    });

    it.each([
      ['operator object', { driverId: { $ne: null } }],
      ['array', { driverId: [VALID] }],
      ['empty string', { driverId: '' }],
      ['missing', {}],
      ['invalid', { driverId: 'abc' }],
    ])('assignDriverSchema rejects %s', (_label, body) => {
      expect(assignDriverSchema.safeParse(body).success).toBe(false);
    });

    it('orderIdParamSchema accepts a valid orderId', () => {
      expect(orderIdParamSchema.safeParse({ orderId: VALID }).success).toBe(true);
    });

    it.each([
      ['operator object', { orderId: { $gt: '' } }],
      ['array', { orderId: [VALID] }],
      ['empty string', { orderId: '' }],
      ['missing', {}],
    ])('orderIdParamSchema rejects %s', (_label, params) => {
      expect(orderIdParamSchema.safeParse(params).success).toBe(false);
    });
  });
});

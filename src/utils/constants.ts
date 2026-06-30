export const BCRYPT_SALT_ROUNDS = 12;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const MAX_SEARCH_RADIUS_KM = 10;
export const MIN_SEARCH_RADIUS_KM = 1;
export const DEFAULT_SEARCH_RADIUS_KM = 5;

export const ORDER_STATUSES = [
  'pending',
  'offered',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export const CANCELLABLE_STATUSES = ['pending', 'offered', 'confirmed'];

// Reminder cadence for a patient's saved/favourite medications
export const REMINDER_FREQUENCIES = ['none', 'daily', 'weekly', 'monthly'] as const;

export const PHARMACY_UPDATABLE_STATUSES: Record<string, string[]> = {
  confirmed: ['preparing'],
  preparing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_BANNED: 'USER_BANNED',
  USER_EXISTS: 'USER_EXISTS',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_INVALID_STATUS: 'ORDER_INVALID_STATUS',
  ORDER_ALREADY_RESPONDED: 'ORDER_ALREADY_RESPONDED',
  PHARMACY_NOT_VERIFIED: 'PHARMACY_NOT_VERIFIED',
  PHARMACY_NOT_OPEN: 'PHARMACY_NOT_OPEN',
  PHARMACY_NOT_FOUND: 'PHARMACY_NOT_FOUND',
  PRESCRIPTION_OCR_FAILED: 'PRESCRIPTION_OCR_FAILED',
  PRESCRIPTION_NOT_FOUND: 'PRESCRIPTION_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REVIEW_ALREADY_EXISTS: 'REVIEW_ALREADY_EXISTS',
  RESPONSE_NOT_FOUND: 'RESPONSE_NOT_FOUND',
  INVENTORY_NOT_FOUND: 'INVENTORY_NOT_FOUND',
  MEDICINE_NOT_FOUND: 'MEDICINE_NOT_FOUND',
  SAVED_MEDICATION_NOT_FOUND: 'SAVED_MEDICATION_NOT_FOUND',
  SAVED_MEDICATION_EXISTS: 'SAVED_MEDICATION_EXISTS',
  SAVED_BASKET_NOT_FOUND: 'SAVED_BASKET_NOT_FOUND',
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  SIDE_EFFECT_REPORT_NOT_FOUND: 'SIDE_EFFECT_REPORT_NOT_FOUND',
  AI_RECOMMENDATION_FAILED: 'AI_RECOMMENDATION_FAILED',
  DELIVERY_NOT_FOUND: 'DELIVERY_NOT_FOUND',
  DELIVERY_INVALID_STATUS: 'DELIVERY_INVALID_STATUS',
  DELIVERY_EXISTS: 'DELIVERY_EXISTS',
  DRIVER_NOT_FOUND: 'DRIVER_NOT_FOUND',
} as const;

// ── Live delivery tracking ──────────────────────────────────────────────────
export const DELIVERY_STATUSES = [
  'assigned',
  'picked_up',
  'in_transit',
  'nearby',
  'delivered',
  'cancelled',
] as const;

/** Allowed forward transitions of the delivery state machine. */
export const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['nearby', 'delivered', 'cancelled'],
  nearby: ['delivered', 'cancelled'],
};

/** Statuses during which the driver's live location may be broadcast. */
export const DELIVERY_TRACKABLE_STATUSES = ['picked_up', 'in_transit', 'nearby'];

/** Terminal statuses — tracking stops, no more location writes. */
export const DELIVERY_TERMINAL_STATUSES = ['delivered', 'cancelled'];

/** Min interval (ms) between persisted GPS history samples per delivery. */
export const GPS_SAMPLE_INTERVAL_MS = 10_000;
/** Min interval (ms) between ETA recomputations (cost control). */
export const ETA_REFRESH_INTERVAL_MS = 15_000;
/** Distance (metres) under which the delivery is considered "nearby". */
export const NEARBY_THRESHOLD_M = 400;

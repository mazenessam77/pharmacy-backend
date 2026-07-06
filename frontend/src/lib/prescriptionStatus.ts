import { PrescriptionStatus } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
  hint: string;
}

// REVIEW_REQUIRED is the post-upload state — prescriptions are stored as-is
// and reviewed manually by the pharmacies an order is sent to. The other
// statuses only exist on legacy prescriptions from the retired automatic-
// processing pipeline and are kept so old records still render sensibly.
export const PRESCRIPTION_STATUS_META: Record<PrescriptionStatus, StatusMeta> = {
  UPLOADED: { label: 'Uploaded', variant: 'success', hint: 'Stored securely — attach it to an order and pharmacies will review it.' },
  QUEUED: { label: 'Uploaded', variant: 'success', hint: 'Stored securely — attach it to an order and pharmacies will review it.' },
  PROCESSING: { label: 'Uploaded', variant: 'success', hint: 'Stored securely — attach it to an order and pharmacies will review it.' },
  PROCESSED: { label: 'Processed', variant: 'success', hint: 'Processed by the retired auto-reader — medicines below.' },
  FAILED: { label: 'Uploaded', variant: 'default', hint: 'The image is stored and viewable by pharmacies you order from.' },
  REVIEW_REQUIRED: { label: 'Awaiting review', variant: 'info', hint: 'Stored securely — pharmacies review it with your order.' },
};

export const metaFor = (status?: PrescriptionStatus): StatusMeta =>
  PRESCRIPTION_STATUS_META[status ?? 'REVIEW_REQUIRED'] ?? PRESCRIPTION_STATUS_META.REVIEW_REQUIRED;

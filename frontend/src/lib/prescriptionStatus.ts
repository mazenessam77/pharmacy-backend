import { PrescriptionStatus } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
  active: boolean; // true while work is still in flight (keep polling)
  /** 0–100 progress for the tracker; FAILED stays where it died. */
  progress: number;
  hint: string;
}

export const PRESCRIPTION_STATUS_META: Record<PrescriptionStatus, StatusMeta> = {
  UPLOADED: { label: 'Uploaded', variant: 'default', active: true, progress: 20, hint: 'Image received, preparing to process.' },
  QUEUED: { label: 'Queued', variant: 'info', active: true, progress: 40, hint: 'Waiting in the processing queue.' },
  PROCESSING: { label: 'Processing', variant: 'info', active: true, progress: 70, hint: 'Reading your prescription…' },
  PROCESSED: { label: 'Processed', variant: 'success', active: false, progress: 100, hint: 'Done — your medicines are ready below.' },
  FAILED: { label: 'Failed', variant: 'danger', active: false, progress: 100, hint: 'We could not process this prescription.' },
  REVIEW_REQUIRED: { label: 'Review Required', variant: 'warning', active: false, progress: 100, hint: 'A pharmacist needs to review this prescription.' },
};

export const metaFor = (status?: PrescriptionStatus): StatusMeta =>
  PRESCRIPTION_STATUS_META[status ?? 'UPLOADED'] ?? PRESCRIPTION_STATUS_META.UPLOADED;

export const isActive = (status?: PrescriptionStatus): boolean => metaFor(status).active;

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, AlertTriangle, RefreshCw, ShoppingCart, Pill, FileText, Check,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { prescriptionService } from '@/lib/services/prescriptionService';
import { useRequestDraftStore } from '@/store/requestDraftStore';
import { metaFor, isActive } from '@/lib/prescriptionStatus';
import { formatDateTime } from '@/lib/helpers';
import { Prescription, PrescriptionStatus } from '@/types';

const POLL_MS = 6000;
const STEPS: { key: PrescriptionStatus; label: string }[] = [
  { key: 'UPLOADED', label: 'Uploaded' },
  { key: 'QUEUED', label: 'Queued' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'PROCESSED', label: 'Done' },
];

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const loadDraft = useRequestDraftStore((s) => s.load);

  const [p, setP] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOne = useCallback(async () => {
    try {
      const res = await prescriptionService.getById(id);
      setP(res.data.data);
    } catch (err: any) {
      if (err?.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  // Poll only while the prescription is still being processed.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (p && isActive(p.status)) {
      timer.current = setTimeout(fetchOne, POLL_MS);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [p, fetchOne]);

  const addToCart = () => {
    const meds = (p?.extractedMeds || []).filter((m) => m.name?.trim());
    if (meds.length === 0) {
      toast.error('No medicines to add');
      return;
    }
    loadDraft(meds.map((m) => ({ name: m.name, quantity: 1 })));
    router.push('/patient/orders/new');
  };

  const resubmit = async () => {
    setResubmitting(true);
    try {
      const res = await prescriptionService.resubmit(id);
      setP(res.data.data.prescription);
      toast.success('Resubmitted — processing again');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Could not resubmit');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  }
  if (notFound || !p) {
    return (
      <div className="max-w-3xl">
        <BackLink />
        <div className="border border-neutral-200 py-16 text-center text-[13px] text-neutral-500">Prescription not found.</div>
      </div>
    );
  }

  const meta = metaFor(p.status);
  const activeIdx = STEPS.findIndex((s) => s.key === p.status);
  const failed = p.status === 'FAILED';
  const review = p.status === 'REVIEW_REQUIRED';
  const meds = p.extractedMeds || [];

  return (
    <div className="max-w-3xl">
      <BackLink />

      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">Prescription #{p._id.slice(-6)}</p>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Results</h1>
        </div>
        <Badge variant={meta.variant}>
          {meta.active && <Loader2 className="w-3 h-3 mr-1 inline animate-spin" />}
          {meta.label}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Original image */}
        <div className="rounded-[16px] border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500 font-medium">
            <FileText className="w-3.5 h-3.5" /> Original
          </div>
          <div className="bg-neutral-50 aspect-[3/4] flex items-center justify-center overflow-hidden">
            {p.imageUrl && p.imageUrl.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt="Prescription" className="w-full h-full object-contain" />
            ) : (
              <span className="text-[12px] text-neutral-400">Image unavailable</span>
            )}
          </div>
        </div>

        {/* Status + results */}
        <div className="space-y-5">
          {/* Tracker */}
          <div className="rounded-[16px] border border-neutral-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => {
                const done = !failed && (activeIdx === -1 ? false : i <= activeIdx);
                const isCurrent = s.key === p.status;
                return (
                  <div key={s.key} className="flex flex-col items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                      done ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-transparent shadow-sm' : 'bg-white text-neutral-400 border-neutral-300'
                    }`}>
                      {done && !isCurrent ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className={`mt-1.5 text-[9px] uppercase tracking-wider ${done ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] text-neutral-500">{meta.hint}</p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-500">
              <span>Uploaded</span><span className="text-right text-neutral-700">{formatDateTime(p.createdAt)}</span>
              {p.processedAt && (<><span>Processed</span><span className="text-right text-neutral-700">{formatDateTime(p.processedAt)}</span></>)}
              {p.failedAt && (<><span>Failed</span><span className="text-right text-neutral-700">{formatDateTime(p.failedAt)}</span></>)}
            </div>
          </div>

          {/* Failed state */}
          {failed && (
            <div className="rounded-[16px] border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-[13px] font-bold uppercase tracking-wide">Processing failed</p>
              </div>
              <p className="text-[12px] text-neutral-600 mb-4">{p.errorDetails || 'Something went wrong while reading this prescription. You can submit it again.'}</p>
              <Button variant="indigo" size="sm" onClick={resubmit} isLoading={resubmitting}>
                <RefreshCw className="w-3.5 h-3.5" /> Re-submit
              </Button>
            </div>
          )}

          {review && (
            <div className="border border-neutral-300 bg-neutral-50 p-4 text-[12px] text-neutral-600">
              A pharmacist needs to review this prescription before its medicines can be used.
            </div>
          )}

          {/* Processed → extracted medicines */}
          {p.status === 'PROCESSED' && (
            <div className="rounded-[16px] border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500 font-medium">
                <Pill className="w-3.5 h-3.5" /> Extracted Medicines
              </div>
              {meds.length === 0 ? (
                <p className="px-4 py-6 text-[12px] text-neutral-400 text-center">No medicines were extracted from this prescription.</p>
              ) : (
                <ul>
                  {meds.map((m, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 last:border-0">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-neutral-900 truncate">{m.name}</p>
                        {typeof m.confidence === 'number' && (
                          <p className="text-[10px] uppercase tracking-wider text-neutral-400">Confidence {Math.round(m.confidence * 100)}%</p>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500 shrink-0">×1</span>
                    </li>
                  ))}
                </ul>
              )}
              {meds.length > 0 && (
                <div className="p-4 border-t border-neutral-200">
                  <Button variant="indigo" onClick={addToCart} className="w-full">
                    <ShoppingCart className="w-4 h-4" /> Add to Request
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/patient/prescriptions" className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-black transition-colors mb-4">
      <ArrowLeft className="w-3.5 h-3.5" /> All prescriptions
    </Link>
  );
}

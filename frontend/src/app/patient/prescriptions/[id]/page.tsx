'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, Pill, FileText } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { prescriptionService } from '@/lib/services/prescriptionService';
import { useRequestDraftStore } from '@/store/requestDraftStore';
import { metaFor } from '@/lib/prescriptionStatus';
import { formatDateTime } from '@/lib/helpers';
import { Prescription } from '@/types';

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const loadDraft = useRequestDraftStore((s) => s.load);

  const [p, setP] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const addToCart = () => {
    const meds = (p?.extractedMeds || []).filter((m) => m.name?.trim());
    if (meds.length === 0) {
      toast.error('No medicines to add');
      return;
    }
    loadDraft(meds.map((m) => ({ name: m.name, quantity: 1 })));
    router.push('/patient/orders/new');
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
  const meds = p.extractedMeds || [];

  return (
    <div className="max-w-3xl">
      <BackLink />

      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">Prescription #{p._id.slice(-6)}</p>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Prescription</h1>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
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

        {/* Details */}
        <div className="space-y-5">
          <div className="rounded-[16px] border border-neutral-100 shadow-sm p-4">
            <p className="text-[12px] text-neutral-500 mb-3">{meta.hint}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-500">
              <span>Uploaded</span><span className="text-right text-neutral-700">{formatDateTime(p.createdAt)}</span>
              {p.doctorName && (<><span>Doctor</span><span className="text-right text-neutral-700">{p.doctorName}</span></>)}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <Link href="/patient/orders/new">
                <Button variant="indigo" size="sm" className="w-full">
                  <ShoppingCart className="w-3.5 h-3.5" /> Order with this prescription
                </Button>
              </Link>
            </div>
          </div>

          {/* Legacy: medicines extracted by the retired auto-reader */}
          {meds.length > 0 && (
            <div className="rounded-[16px] border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500 font-medium">
                <Pill className="w-3.5 h-3.5" /> Extracted Medicines
              </div>
              <ul>
                {meds.map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 last:border-0">
                    <p className="text-[13px] font-medium text-neutral-900 truncate">{m.name}</p>
                    <span className="text-[11px] text-neutral-500 shrink-0">×1</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 border-t border-neutral-200">
                <Button variant="indigo" onClick={addToCart} className="w-full">
                  <ShoppingCart className="w-4 h-4" /> Add to Request
                </Button>
              </div>
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

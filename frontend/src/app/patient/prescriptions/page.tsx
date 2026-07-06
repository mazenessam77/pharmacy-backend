'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FileText, Upload, Loader2, ArrowRight, Pill } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { usePrescriptionStore } from '@/store/prescriptionStore';
import { prescriptionService } from '@/lib/services/prescriptionService';
import { metaFor } from '@/lib/prescriptionStatus';
import { formatDateTime } from '@/lib/helpers';
import { Prescription } from '@/types';

export default function PrescriptionsPage() {
  const { items, loading, loaded, fetchList } = usePrescriptionStore();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use a JPG, PNG, or WebP image');
      return;
    }
    setUploading(true);
    try {
      await prescriptionService.upload(file);
      toast.success('Prescription uploaded');
      await fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] text-white p-7 mb-6 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 shadow-[0_30px_70px_-25px_rgba(147,51,234,0.55)]">
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.5) 0%, transparent 45%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
            <FileText className="w-3 h-3" />
            Prescriptions
          </div>
          <h1 className="text-[26px] font-black leading-tight">My Prescriptions</h1>
          <p className="text-white/80 mt-1.5 text-[13px] max-w-md">
            Upload a prescription and attach it to an order — pharmacies review the image and reply with availability and prices.
          </p>
        </div>
      </div>

      {/* Uploader */}
      <label className="flex items-center justify-between gap-4 rounded-[16px] border border-neutral-200 bg-white shadow-sm p-5 mb-6 cursor-pointer hover:border-violet-300 hover:shadow-md transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-sm">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-[13px] font-bold">{uploading ? 'Uploading…' : 'Upload a prescription'}</p>
            <p className="text-[11px] text-neutral-500">JPG, PNG or WebP — shared only with pharmacies you order from</p>
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600">Choose file</span>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPick} disabled={uploading} />
      </label>

      {loading && !loaded ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-[20px] border border-neutral-100 bg-white shadow-md py-16 text-center">
          <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <p className="text-[13px] text-neutral-500">No prescriptions yet — upload one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => <PrescriptionRow key={p._id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function PrescriptionRow({ p }: { p: Prescription }) {
  const meta = metaFor(p.status);
  const medCount = p.extractedMeds?.length ?? 0;

  return (
    <Link
      href={`/patient/prescriptions/${p._id}`}
      className="block rounded-[16px] border border-neutral-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-neutral-900">Prescription #{p._id.slice(-6)}</p>
            <p className="text-[11px] text-neutral-500">{formatDateTime(p.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <ArrowRight className="w-4 h-4 text-neutral-300" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
        <span>{meta.hint}</span>
        {p.status === 'PROCESSED' && <span className="inline-flex items-center gap-1 font-medium text-neutral-700"><Pill className="w-3 h-3" />{medCount} medicine{medCount === 1 ? '' : 's'}</span>}
      </div>
    </Link>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FileText, Upload, Loader2, ArrowRight, Pill, AlertTriangle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { usePrescriptionStore } from '@/store/prescriptionStore';
import { prescriptionService } from '@/lib/services/prescriptionService';
import { metaFor } from '@/lib/prescriptionStatus';
import { formatDateTime } from '@/lib/helpers';
import { Prescription } from '@/types';

const POLL_MS = 7000;

export default function PrescriptionsPage() {
  const { items, loading, loaded, fetchList, hasActive } = usePrescriptionStore();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Poll the list while any prescription is still processing; idle otherwise.
  useEffect(() => {
    const id = setInterval(() => {
      if (hasActive()) fetchList();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchList, hasActive]);

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
      toast.success('Prescription uploaded — processing started');
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
      <div className="bg-black text-white p-7 mb-6">
        <div className="inline-flex items-center gap-1.5 border border-white/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
          <FileText className="w-3 h-3" />
          Prescriptions
        </div>
        <h1 className="text-[26px] font-extrabold uppercase tracking-wide leading-tight">My Prescriptions</h1>
        <p className="text-neutral-400 mt-1.5 text-[13px] max-w-md">
          Upload a prescription and track its processing — extracted medicines appear here when it&apos;s done.
        </p>
      </div>

      {/* Uploader */}
      <label className="flex items-center justify-between gap-4 border border-black p-5 mb-6 cursor-pointer hover:bg-neutral-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide">{uploading ? 'Uploading…' : 'Upload a prescription'}</p>
            <p className="text-[11px] text-neutral-500">JPG, PNG or WebP — processed automatically</p>
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Choose file</span>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPick} disabled={uploading} />
      </label>

      {loading && !loaded ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="border border-neutral-200 py-16 text-center">
          <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
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
      className="block border border-neutral-200 hover:border-black transition-colors p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-neutral-900">Prescription #{p._id.slice(-6)}</p>
            <p className="text-[11px] text-neutral-500">{formatDateTime(p.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={meta.variant}>
            {meta.active && <Loader2 className="w-2.5 h-2.5 mr-1 inline animate-spin" />}
            {meta.label}
          </Badge>
          <ArrowRight className="w-4 h-4 text-neutral-300" />
        </div>
      </div>

      {/* progress bar */}
      <div className="mt-4 h-px bg-neutral-200 relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${p.status === 'FAILED' ? 'bg-neutral-400' : 'bg-black'}`}
          style={{ width: `${meta.progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <span>{meta.hint}</span>
        {p.status === 'PROCESSED' && <span className="inline-flex items-center gap-1 font-medium text-neutral-700"><Pill className="w-3 h-3" />{medCount} medicine{medCount === 1 ? '' : 's'}</span>}
        {p.status === 'FAILED' && <span className="inline-flex items-center gap-1 font-medium text-neutral-700"><AlertTriangle className="w-3 h-3" />Tap to retry</span>}
      </div>
    </Link>
  );
}

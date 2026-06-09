'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Pill,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { sideEffectService } from '@/lib/services/sideEffectService';
import { formatDate } from '@/lib/helpers';

interface Report {
  _id: string;
  medicineName: string;
  sideEffects: string[];
  severity: 'mild' | 'moderate' | 'severe';
  status: 'pending_ai' | 'pending_review' | 'approved' | 'rejected';
  aiRecommendation?: {
    alternatives: { name: string }[];
    summary: string;
  };
  createdAt: string;
}

const statusBadge: Record<Report['status'], { label: string; variant: 'warning' | 'info' | 'success' | 'danger' }> = {
  pending_ai: { label: 'Generating AI', variant: 'info' },
  pending_review: { label: 'Awaiting Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

export default function PatientSideEffectsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await sideEffectService.getMine({ page: 1, limit: 20 });
      setReports(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-4xl">
      <div
        className="rounded-none p-7 mb-7 text-white relative overflow-hidden"
        style={{
          background: '#000000',
          boxShadow: 'none',
        }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-none blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-none px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              AI Assistant
            </div>
            <h1 className="text-[26px] font-extrabold leading-tight">
              Side Effect Reports
            </h1>
            <p className="text-neutral-400/90 mt-1.5 text-[13px] font-medium max-w-md">
              Tell us if a medicine made you feel bad. We'll suggest safer alternatives — reviewed by a pharmacist.
            </p>
          </div>
          <Link
            href="/patient/side-effects/new"
            className="shrink-0 flex items-center gap-2 bg-white text-neutral-900 font-bold text-[13px] px-5 py-3 rounded-none hover:bg-neutral-100 active:scale-95 transition-all duration-200"
            style={{ boxShadow: 'none' }}
          >
            <Plus className="w-4 h-4" />
            Report Side Effect
          </Link>
        </div>
      </div>

      <div className="glass rounded-none card-shadow p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-bold text-neutral-800">My Reports</h2>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
        ) : reports.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-16 h-16 rounded-none flex items-center justify-center mx-auto mb-4 bg-neutral-100">
              <AlertTriangle className="w-7 h-7 text-neutral-900" />
            </div>
            <p className="text-[13px] font-medium text-neutral-500 mb-4">
              No side effect reports yet.
            </p>
            <Link
              href="/patient/side-effects/new"
              className="inline-flex items-center gap-2 bg-black text-white text-[12px] font-bold px-5 py-2.5 rounded-none hover:bg-black active:scale-95 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Submit Your First Report
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => {
              const sb = statusBadge[r.status];
              const StatusIcon =
                r.status === 'approved'
                  ? CheckCircle2
                  : r.status === 'rejected'
                  ? XCircle
                  : Clock;
              return (
                <Link
                  key={r._id}
                  href={`/patient/side-effects/${r._id}`}
                  className="flex items-start gap-4 p-4 rounded-none hover:bg-neutral-100/60 active:scale-[0.99] transition-all duration-200 group border border-transparent hover:border-neutral-200"
                >
                  <div className="w-11 h-11 rounded-none bg-neutral-100 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-neutral-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-neutral-800 truncate group-hover:text-neutral-900 transition-colors">
                      {r.medicineName}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                      Side effects: {r.sideEffects.join(', ')}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">
                      {formatDate(r.createdAt)}
                    </p>
                    {r.aiRecommendation && r.aiRecommendation.alternatives.length > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-neutral-900">
                        <Sparkles className="w-3 h-3" />
                        {r.aiRecommendation.alternatives.length} alternative{r.aiRecommendation.alternatives.length > 1 ? 's' : ''} suggested
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={sb.variant}>
                      <StatusIcon className="w-3 h-3 mr-1 inline" />
                      {sb.label}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

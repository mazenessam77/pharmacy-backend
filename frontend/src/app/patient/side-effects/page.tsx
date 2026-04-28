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
        className="rounded-3xl p-7 mb-7 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #14b8a6 100%)',
          boxShadow: '0 20px 40px -10px rgba(2,132,199,0.45)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              AI Assistant
            </div>
            <h1 className="text-[26px] font-extrabold leading-tight">
              Side Effect Reports
            </h1>
            <p className="text-sky-100/90 mt-1.5 text-[13px] font-medium max-w-md">
              Tell us if a medicine made you feel bad. We'll suggest safer alternatives — reviewed by a pharmacist.
            </p>
          </div>
          <Link
            href="/patient/side-effects/new"
            className="shrink-0 flex items-center gap-2 bg-white text-sky-700 font-bold text-[13px] px-5 py-3 rounded-2xl hover:bg-sky-50 active:scale-95 transition-all duration-200"
            style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
          >
            <Plus className="w-4 h-4" />
            Report Side Effect
          </Link>
        </div>
      </div>

      <div className="glass rounded-3xl card-shadow p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-zinc-100">My Reports</h2>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
        ) : reports.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-sky-50 dark:bg-sky-950/40">
              <AlertTriangle className="w-7 h-7 text-sky-500 dark:text-sky-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-400 mb-4">
              No side effect reports yet.
            </p>
            <Link
              href="/patient/side-effects/new"
              className="inline-flex items-center gap-2 bg-sky-600 text-white text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-sky-700 active:scale-95 transition-all duration-200"
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
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-sky-50/60 dark:hover:bg-sky-900/20 active:scale-[0.99] transition-all duration-200 group border border-transparent hover:border-sky-100 dark:hover:border-sky-900/40"
                >
                  <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-zinc-100 truncate group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                      {r.medicineName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1">
                      Side effects: {r.sideEffects.join(', ')}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 font-medium">
                      {formatDate(r.createdAt)}
                    </p>
                    {r.aiRecommendation && r.aiRecommendation.alternatives.length > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
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
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-500 group-hover:text-sky-400 transition-colors" />
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

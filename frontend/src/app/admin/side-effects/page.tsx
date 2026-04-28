'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Pill,
  Sparkles,
  User,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { sideEffectService } from '@/lib/services/sideEffectService';
import { formatDate } from '@/lib/helpers';

interface Report {
  _id: string;
  patientId: { _id: string; name: string; email: string } | string;
  medicineName: string;
  sideEffects: string[];
  severity: 'mild' | 'moderate' | 'severe';
  status: 'pending_ai' | 'pending_review' | 'approved' | 'rejected';
  aiRecommendation?: { alternatives: any[]; summary: string };
  createdAt: string;
}

const STATUSES: { key: string; label: string }[] = [
  { key: 'pending_review', label: 'Awaiting Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const severityColor: Record<Report['severity'], string> = {
  mild: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  severe: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

export default function AdminSideEffectsListPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('pending_review');

  const load = async () => {
    setLoading(true);
    try {
      const res = await sideEffectService.getPending({ status: activeStatus, page: 1, limit: 50 });
      setReports(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeStatus]);

  return (
    <div className="max-w-5xl">
      <div className="mb-7">
        <h1 className="text-[24px] font-extrabold text-slate-800 dark:text-zinc-100 mb-1.5">
          Side Effect Reports
        </h1>
        <p className="text-[13px] text-slate-500 dark:text-zinc-400">
          Review patient side effect reports and AI-suggested alternatives.
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveStatus(s.key)}
            className={`px-4 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all duration-200 ${
              activeStatus === s.key
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <CardSkeleton key={i} />)
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-sky-50 dark:bg-sky-950/40">
              <AlertTriangle className="w-7 h-7 text-sky-500 dark:text-sky-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-400">
              No reports in this category.
            </p>
          </div>
        ) : (
          reports.map((r) => {
            const StatusIcon =
              r.status === 'approved'
                ? CheckCircle2
                : r.status === 'rejected'
                ? XCircle
                : Clock;
            const patient = typeof r.patientId === 'object' ? r.patientId : null;
            return (
              <Link
                key={r._id}
                href={`/admin/side-effects/${r._id}`}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-5 flex items-start gap-4 hover:shadow-xl active:scale-[0.99] transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-bold text-slate-800 dark:text-zinc-100 truncate">
                      {r.medicineName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${severityColor[r.severity]}`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  {patient && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 inline-flex items-center gap-1.5 mb-1.5">
                      <User className="w-3 h-3" />
                      {patient.name}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                    Side effects: {r.sideEffects.join(', ')}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                      {formatDate(r.createdAt)}
                    </span>
                    {r.aiRecommendation && r.aiRecommendation.alternatives.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                        <Sparkles className="w-3 h-3" />
                        {r.aiRecommendation.alternatives.length} AI suggestion(s)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge
                    variant={
                      r.status === 'approved'
                        ? 'success'
                        : r.status === 'rejected'
                        ? 'danger'
                        : r.status === 'pending_review'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    <StatusIcon className="w-3 h-3 mr-1 inline" />
                    {r.status.replace('_', ' ')}
                  </Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-500" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

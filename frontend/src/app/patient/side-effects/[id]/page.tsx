'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Pill,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ShieldCheck,
  ScrollText,
  RefreshCw,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { sideEffectService } from '@/lib/services/sideEffectService';
import { formatDate } from '@/lib/helpers';
import toast from 'react-hot-toast';

interface Alternative {
  name: string;
  genericName?: string;
  reason: string;
  avoidedSideEffect: string;
  requiresPrescription: boolean;
}

interface Report {
  _id: string;
  medicineName: string;
  condition?: string;
  sideEffects: string[];
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  status: 'pending_ai' | 'pending_review' | 'approved' | 'rejected';
  aiRecommendation?: {
    alternatives: Alternative[];
    summary: string;
    disclaimer: string;
    generatedAt: string;
  };
  doctorNotes?: string;
  createdAt: string;
}

const severityColors: Record<Report['severity'], string> = {
  mild: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  severe: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

export default function SideEffectReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    try {
      const res = await sideEffectService.getById(id);
      setReport(res.data.data);
    } catch {
      toast.error('Could not load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await sideEffectService.regenerate(id);
      setReport(res.data.data);
      toast.success('AI recommendation regenerated');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Regenerate failed');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-3xl py-20 text-center">
        <p className="text-slate-500 dark:text-zinc-400">Report not found.</p>
      </div>
    );
  }

  const StatusIcon =
    report.status === 'approved'
      ? CheckCircle2
      : report.status === 'rejected'
      ? XCircle
      : Clock;

  const statusLabel: Record<Report['status'], string> = {
    pending_ai: 'AI is generating suggestions...',
    pending_review: 'Awaiting pharmacist review',
    approved: 'Approved by pharmacist',
    rejected: 'Rejected by pharmacist',
  };

  const statusColor: Record<Report['status'], string> = {
    pending_ai: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    pending_review: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    approved: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    rejected: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/patient/side-effects')}
        className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </button>

      {/* Status banner */}
      <div className={`rounded-3xl border-2 p-5 mb-6 ${statusColor[report.status]}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-[14px] font-bold">{statusLabel[report.status]}</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              Submitted {formatDate(report.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Report info */}
      <div className="glass rounded-3xl card-shadow p-6 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-extrabold text-slate-800 dark:text-zinc-100">
              {report.medicineName}
            </h2>
            {report.condition && (
              <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-1">
                Treating: <span className="font-semibold">{report.condition}</span>
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${severityColors[report.severity]}`}
          >
            {report.severity}
          </span>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-zinc-500 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Reported Side Effects
          </p>
          <div className="flex flex-wrap gap-1.5">
            {report.sideEffects.map((s) => (
              <span
                key={s}
                className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/60"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {report.notes && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-zinc-500 mb-1">
              Patient Notes
            </p>
            <p className="text-[13px] text-slate-700 dark:text-zinc-300">{report.notes}</p>
          </div>
        )}
      </div>

      {/* AI recommendation */}
      <div className="glass rounded-3xl card-shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-zinc-100">AI Recommendation</h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                Powered by Claude
              </p>
            </div>
          </div>
          {report.status !== 'approved' && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>

        {!report.aiRecommendation || report.aiRecommendation.alternatives.length === 0 ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-3" />
            <p className="text-[12px] text-slate-500 dark:text-zinc-400">
              {report.status === 'pending_ai'
                ? 'AI is analyzing your case...'
                : 'No alternatives generated. Try regenerating.'}
            </p>
          </div>
        ) : (
          <>
            {report.aiRecommendation.summary && (
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-teal-50 dark:from-sky-950/30 dark:to-teal-950/30 border border-sky-100 dark:border-sky-900/40">
                <p className="text-[13px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {report.aiRecommendation.summary}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {report.aiRecommendation.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-slate-800 dark:text-zinc-100">
                          {alt.name}
                        </p>
                        {alt.genericName && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            Generic: {alt.genericName}
                          </p>
                        )}
                      </div>
                    </div>
                    {alt.requiresPrescription && (
                      <Badge variant="warning">Rx Required</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-600 dark:text-zinc-300 leading-relaxed mb-2 ml-11">
                    {alt.reason}
                  </p>
                  <div className="ml-11 inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Avoids: {alt.avoidedSideEffect}
                  </div>
                </div>
              ))}
            </div>

            {report.aiRecommendation.disclaimer && (
              <div className="mt-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <p className="text-[11px] text-amber-800 dark:text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{report.aiRecommendation.disclaimer}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Doctor notes */}
      {report.doctorNotes && (
        <div className="glass rounded-3xl card-shadow p-6">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-zinc-100">
              Pharmacist Notes
            </h3>
          </div>
          <p className="text-[13px] text-slate-700 dark:text-zinc-300 leading-relaxed">
            {report.doctorNotes}
          </p>
        </div>
      )}
    </div>
  );
}

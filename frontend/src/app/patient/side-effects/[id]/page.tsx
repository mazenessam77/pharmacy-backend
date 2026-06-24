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
  mild: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  severe: 'bg-rose-100 text-rose-700',
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
        <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-3xl py-20 text-center">
        <p className="text-neutral-500">Report not found.</p>
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
    pending_ai: 'bg-blue-50 text-blue-700 border-blue-200',
    pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/patient/side-effects')}
        className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </button>

      {/* Status banner */}
      <div className={`rounded-[16px] border-2 p-5 mb-6 ${statusColor[report.status]}`}>
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
      <div className="bg-white rounded-[20px] border border-neutral-100 shadow-md p-6 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-orange-400 to-rose-600 shadow-md flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-black text-neutral-900">
              {report.medicineName}
            </h2>
            {report.condition && (
              <p className="text-[12px] text-neutral-500 mt-1">
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
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Reported Side Effects
          </p>
          <div className="flex flex-wrap gap-1.5">
            {report.sideEffects.map((s) => (
              <span
                key={s}
                className="bg-rose-50 text-rose-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-rose-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {report.notes && (
          <div className="mt-4 p-3 rounded-none bg-neutral-50 border border-neutral-200">
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-1">
              Patient Notes
            </p>
            <p className="text-[13px] text-neutral-700">{report.notes}</p>
          </div>
        )}
      </div>

      {/* AI recommendation */}
      <div className="bg-white rounded-[20px] border border-neutral-100 shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-neutral-900">AI Recommendation</h3>
              <p className="text-[10px] text-neutral-400">
                Powered by Claude
              </p>
            </div>
          </div>
          {report.status !== 'approved' && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-[11px] font-semibold text-neutral-900 hover:text-neutral-900 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>

        {!report.aiRecommendation || report.aiRecommendation.alternatives.length === 0 ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-900 mx-auto mb-3" />
            <p className="text-[12px] text-neutral-500">
              {report.status === 'pending_ai'
                ? 'AI is analyzing your case...'
                : 'No alternatives generated. Try regenerating.'}
            </p>
          </div>
        ) : (
          <>
            {report.aiRecommendation.summary && (
              <div className="mb-5 p-4 rounded-none border border-neutral-200">
                <p className="text-[13px] text-neutral-700 leading-relaxed">
                  {report.aiRecommendation.summary}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {report.aiRecommendation.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="p-4 rounded-[14px] border border-neutral-100 bg-white shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-emerald-400 to-teal-600 shadow-sm flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-neutral-800">
                          {alt.name}
                        </p>
                        {alt.genericName && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Generic: {alt.genericName}
                          </p>
                        )}
                      </div>
                    </div>
                    {alt.requiresPrescription && (
                      <Badge variant="warning">Rx Required</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-neutral-600 leading-relaxed mb-2 ml-11">
                    {alt.reason}
                  </p>
                  <div className="ml-11 inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Avoids: {alt.avoidedSideEffect}
                  </div>
                </div>
              ))}
            </div>

            {report.aiRecommendation.disclaimer && (
              <div className="mt-5 p-3 rounded-none bg-neutral-100 border border-neutral-200">
                <p className="text-[11px] text-neutral-900 flex items-start gap-2">
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
        <div className="bg-white rounded-[20px] border border-neutral-100 shadow-md p-6">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-4 h-4 text-neutral-900" />
            <h3 className="text-[14px] font-bold text-neutral-800">
              Pharmacist Notes
            </h3>
          </div>
          <p className="text-[13px] text-neutral-700 leading-relaxed">
            {report.doctorNotes}
          </p>
        </div>
      )}
    </div>
  );
}

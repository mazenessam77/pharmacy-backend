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
  Loader2,
  ShieldCheck,
  User,
  Mail,
  Phone,
  RefreshCw,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
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
  patientId: { _id: string; name: string; email: string; phone?: string };
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
    model: string;
  };
  doctorNotes?: string;
  reviewedBy?: { _id: string; name: string };
  reviewedAt?: string;
  createdAt: string;
}

export default function AdminReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');

  const load = async () => {
    try {
      const res = await sideEffectService.getById(id);
      setReport(res.data.data);
      setDoctorNotes(res.data.data.doctorNotes || '');
    } catch {
      toast.error('Could not load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleReview = async (decision: 'approved' | 'rejected') => {
    if (!report) return;
    setSubmitting(true);
    try {
      const res = await sideEffectService.review(id, decision, doctorNotes.trim() || undefined);
      setReport(res.data.data);
      toast.success(`Report ${decision}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="max-w-4xl flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl py-20 text-center">
        <p className="text-neutral-500">Report not found.</p>
      </div>
    );
  }

  const isReviewable = report.status === 'pending_review' || report.status === 'pending_ai';

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => router.push('/admin/side-effects')}
        className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Patient + Medicine */}
          <div className="bg-white rounded-none border border-neutral-200 p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-none bg-neutral-100 flex items-center justify-center shrink-0">
                <Pill className="w-6 h-6 text-neutral-900" />
              </div>
              <div className="flex-1">
                <h1 className="text-[20px] font-extrabold text-neutral-800">
                  {report.medicineName}
                </h1>
                {report.condition && (
                  <p className="text-[12px] text-neutral-500 mt-1">
                    Treating: <span className="font-semibold">{report.condition}</span>
                  </p>
                )}
              </div>
              <Badge
                variant={
                  report.severity === 'severe'
                    ? 'danger'
                    : report.severity === 'moderate'
                    ? 'warning'
                    : 'success'
                }
              >
                {report.severity}
              </Badge>
            </div>

            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Side Effects
              </p>
              <div className="flex flex-wrap gap-1.5">
                {report.sideEffects.map((s) => (
                  <span
                    key={s}
                    className="bg-neutral-100 text-neutral-900 text-[11px] font-semibold px-2.5 py-1 rounded-none border border-neutral-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {report.notes && (
              <div className="p-3 rounded-none bg-neutral-50 border border-neutral-200">
                <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-1">
                  Patient Notes
                </p>
                <p className="text-[13px] text-neutral-700">{report.notes}</p>
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="bg-white rounded-none border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-none flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-neutral-800">
                    AI Suggested Alternatives
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    {report.aiRecommendation?.model || 'Claude'} ·{' '}
                    {report.aiRecommendation?.generatedAt
                      ? formatDate(report.aiRecommendation.generatedAt)
                      : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="text-[11px] font-semibold text-neutral-900 hover:text-neutral-900 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>

            {!report.aiRecommendation || report.aiRecommendation.alternatives.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[12px] text-neutral-500">
                  No AI alternatives available.
                </p>
              </div>
            ) : (
              <>
                {report.aiRecommendation.summary && (
                  <div className="mb-4 p-4 rounded-none border border-neutral-200">
                    <p className="text-[13px] text-neutral-700 leading-relaxed">
                      {report.aiRecommendation.summary}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {report.aiRecommendation.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-none border border-neutral-200 bg-neutral-50/50"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-none bg-neutral-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-neutral-900" />
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
                      <div className="ml-11 inline-flex items-center gap-1.5 text-[10px] font-semibold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-none">
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
        </div>

        {/* Sidebar: Patient + Review actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-none border border-neutral-200 p-5">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-3">
              Patient
            </h3>
            <div className="space-y-2">
              <p className="text-[14px] font-bold text-neutral-800 inline-flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-900" />
                {report.patientId.name}
              </p>
              <p className="text-[11px] text-neutral-500 inline-flex items-center gap-2 break-all">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {report.patientId.email}
              </p>
              {report.patientId.phone && (
                <p className="text-[11px] text-neutral-500 inline-flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  {report.patientId.phone}
                </p>
              )}
              <p className="text-[10px] text-neutral-400 mt-3">
                Submitted {formatDate(report.createdAt)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-none border border-neutral-200 p-5">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-3">
              Pharmacist Notes
            </h3>
            <Textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Add notes for the patient..."
              rows={5}
              disabled={!isReviewable}
            />

            {isReviewable ? (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => handleReview('rejected')}
                  isLoading={submitting}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => handleReview('approved')}
                  isLoading={submitting}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-none bg-neutral-50 border border-neutral-200">
                <p className="text-[11px] font-semibold text-neutral-700 mb-1">
                  Already reviewed
                </p>
                <p className="text-[10px] text-neutral-500">
                  Status: <span className="font-bold uppercase">{report.status}</span>
                  {report.reviewedAt && <> · {formatDate(report.reviewedAt)}</>}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

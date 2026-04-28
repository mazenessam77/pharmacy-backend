'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Plus, Trash2, Pill, StickyNote, Activity, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import toast from 'react-hot-toast';
import { sideEffectService } from '@/lib/services/sideEffectService';

const COMMON_SIDE_EFFECTS = [
  'Nausea',
  'Headache',
  'Dizziness',
  'Drowsiness',
  'Stomach pain',
  'Rash',
  'Itching',
  'Vomiting',
  'Diarrhea',
  'Insomnia',
  'Dry mouth',
  'Fatigue',
];

export default function NewSideEffectReportPage() {
  const router = useRouter();
  const [medicineName, setMedicineName] = useState('');
  const [condition, setCondition] = useState('');
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [customSideEffect, setCustomSideEffect] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleSideEffect = (s: string) => {
    setSideEffects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addCustomSideEffect = () => {
    const trimmed = customSideEffect.trim();
    if (!trimmed || sideEffects.includes(trimmed)) return;
    setSideEffects([...sideEffects, trimmed]);
    setCustomSideEffect('');
  };

  const removeSideEffect = (s: string) => {
    setSideEffects(sideEffects.filter((x) => x !== s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) {
      toast.error('Enter the medicine name');
      return;
    }
    if (sideEffects.length === 0) {
      toast.error('Select at least one side effect');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sideEffectService.create({
        medicineName: medicineName.trim(),
        condition: condition.trim() || undefined,
        sideEffects,
        severity,
        notes: notes.trim() || undefined,
      });
      toast.success('Report submitted! AI is analyzing alternatives...');
      const id = res.data.data?._id;
      router.push(id ? `/patient/side-effects/${id}` : '/patient/side-effects');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const severityChip = (val: 'mild' | 'moderate' | 'severe', label: string, color: string) => (
    <button
      type="button"
      onClick={() => setSeverity(val)}
      className={`flex-1 px-4 py-3 rounded-xl text-[12px] font-bold transition-all duration-200 border-2 ${
        severity === val
          ? `${color} border-transparent text-white shadow-lg`
          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-sky-200 dark:hover:border-sky-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-2xl">
      <div
        className="rounded-3xl p-6 mb-6 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #14b8a6 100%)',
          boxShadow: '0 20px 40px -10px rgba(2,132,199,0.45)',
        }}
      >
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-3 h-3" />
            AI-Powered Report
          </div>
          <h1 className="text-[24px] font-extrabold">Report Side Effect</h1>
          <p className="text-sky-100/90 mt-1.5 text-[13px]">
            We'll suggest alternative medicines without that side effect.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-3xl card-shadow p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-zinc-200 mb-2">
              <Pill className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Medicine Name
            </label>
            <Input
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g. Panadol, Augmentin..."
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-zinc-200 mb-2">
              <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              What was it for? <span className="text-slate-400 dark:text-zinc-500 font-normal">(optional)</span>
            </label>
            <Input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. headache, infection, blood pressure..."
            />
          </div>
        </div>

        <div className="glass rounded-3xl card-shadow p-6">
          <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-zinc-200 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Side Effects You Experienced
          </label>

          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_SIDE_EFFECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSideEffect(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                  sideEffects.includes(s)
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-200/40 dark:shadow-sky-900/40'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-700 dark:hover:text-sky-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={customSideEffect}
              onChange={(e) => setCustomSideEffect(e.target.value)}
              placeholder="Add your own..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSideEffect();
                }
              }}
            />
            <Button type="button" variant="indigo" size="sm" onClick={addCustomSideEffect}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {sideEffects.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
              <p className="text-[10px] uppercase tracking-widest font-bold text-sky-700 dark:text-sky-400 mb-2">
                Selected ({sideEffects.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sideEffects.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 bg-white dark:bg-zinc-900 text-sky-800 dark:text-sky-300 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSideEffect(s)}
                      className="text-sky-500 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass rounded-3xl card-shadow p-6">
          <label className="text-[12px] font-bold text-slate-700 dark:text-zinc-200 mb-3 block">
            Severity
          </label>
          <div className="flex gap-2">
            {severityChip('mild', 'Mild', 'bg-emerald-500')}
            {severityChip('moderate', 'Moderate', 'bg-amber-500')}
            {severityChip('severe', 'Severe', 'bg-red-500')}
          </div>
        </div>

        <div className="glass rounded-3xl card-shadow p-6">
          <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-zinc-200 mb-2">
            <StickyNote className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Additional Notes <span className="text-slate-400 dark:text-zinc-500 font-normal">(optional)</span>
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else? Allergies, when symptoms started, etc."
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" variant="indigo" size="lg" className="flex-1" isLoading={submitting}>
            <Sparkles className="w-4 h-4" />
            Submit & Get AI Suggestion
          </Button>
        </div>
      </form>
    </div>
  );
}

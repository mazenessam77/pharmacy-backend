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
      className={`flex-1 px-4 py-3 rounded-none text-[12px] font-bold transition-all duration-200 border-2 ${
        severity === val
          ? `${color} border-transparent text-white `
          : 'bg-white  border-neutral-200  text-neutral-600  hover:border-neutral-200 '
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-2xl">
      <div
        className="rounded-none p-6 mb-6 text-white relative overflow-hidden"
        style={{
          background: '#000000',
          boxShadow: 'none',
        }}
      >
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-none px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-3 h-3" />
            AI-Powered Report
          </div>
          <h1 className="text-[24px] font-extrabold">Report Side Effect</h1>
          <p className="text-neutral-400/90 mt-1.5 text-[13px]">
            We'll suggest alternative medicines without that side effect.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-none card-shadow p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-[12px] font-bold text-neutral-700 mb-2">
              <Pill className="w-4 h-4 text-neutral-900" />
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
            <label className="flex items-center gap-2 text-[12px] font-bold text-neutral-700 mb-2">
              <Activity className="w-4 h-4 text-neutral-900" />
              What was it for? <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <Input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. headache, infection, blood pressure..."
            />
          </div>
        </div>

        <div className="glass rounded-none card-shadow p-6">
          <label className="flex items-center gap-2 text-[12px] font-bold text-neutral-700 mb-3">
            <AlertTriangle className="w-4 h-4 text-neutral-900" />
            Side Effects You Experienced
          </label>

          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_SIDE_EFFECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSideEffect(s)}
                className={`px-3 py-1.5 rounded-none text-[11px] font-semibold transition-all duration-200 ${
                  sideEffects.includes(s)
                    ? 'bg-black text-white   '
                    : 'bg-neutral-100  text-neutral-600  hover:bg-neutral-100  hover:text-neutral-900 '
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
            <div className="mt-4 p-3 rounded-none bg-neutral-100 border border-neutral-200">
              <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-900 mb-2">
                Selected ({sideEffects.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sideEffects.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 bg-white text-neutral-900 text-[11px] font-semibold px-2.5 py-1 rounded-none border border-neutral-200"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSideEffect(s)}
                      className="text-neutral-900 hover:text-neutral-900"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass rounded-none card-shadow p-6">
          <label className="text-[12px] font-bold text-neutral-700 mb-3 block">
            Severity
          </label>
          <div className="flex gap-2">
            {severityChip('mild', 'Mild', 'bg-black')}
            {severityChip('moderate', 'Moderate', 'bg-black')}
            {severityChip('severe', 'Severe', 'bg-black')}
          </div>
        </div>

        <div className="glass rounded-none card-shadow p-6">
          <label className="flex items-center gap-2 text-[12px] font-bold text-neutral-700 mb-2">
            <StickyNote className="w-4 h-4 text-neutral-900" />
            Additional Notes <span className="text-neutral-400 font-normal">(optional)</span>
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

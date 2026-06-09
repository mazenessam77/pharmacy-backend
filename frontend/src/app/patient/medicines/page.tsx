'use client';

import { useEffect, useState } from 'react';
import { Search, Pill, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import MedicineIcon from '@/components/shared/MedicineIcon';
import SaveMedicationButton from '@/components/shared/SaveMedicationButton';
import { medicineService } from '@/lib/services/medicineService';
import { useSavedMedicationStore } from '@/store/savedMedicationStore';
import { Medicine } from '@/types';

export default function PatientMedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const fetchSaved = useSavedMedicationStore((s) => s.fetch);

  // Load the patient's saved list once so hearts render in the right state.
  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  // Debounced catalog search.
  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await medicineService.getAll({ search: search.trim() || undefined, limit: 30 });
        const list: Medicine[] = res.data.data?.medicines || res.data.data || [];
        if (active) setMedicines(list.filter((m) => m.isActive !== false));
      } finally {
        if (active) setLoading(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [search]);

  return (
    <div className="max-w-5xl">
      {/* Hero */}
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
              Medicine Catalog
            </div>
            <h1 className="text-[26px] font-extrabold leading-tight">Browse Medicines</h1>
            <p className="text-sky-100/90 mt-1.5 text-[13px] font-medium max-w-md">
              Tap the heart to save medicines you take often — then reorder them in one click.
            </p>
          </div>
          <Link
            href="/patient/saved"
            className="shrink-0 flex items-center gap-2 bg-white text-sky-700 font-bold text-[13px] px-5 py-3 rounded-2xl hover:bg-sky-50 active:scale-95 transition-all duration-200"
            style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
          >
            <Heart className="w-4 h-4" />
            Saved
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or generic name…"
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-[14px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-700 focus:border-sky-400 transition-all"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : medicines.length === 0 ? (
        <div className="glass rounded-3xl card-shadow py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-sky-50 dark:bg-sky-950/40">
            <Pill className="w-7 h-7 text-sky-500 dark:text-sky-400" />
          </div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-400">
            {search ? `No medicines match "${search}".` : 'No medicines available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((m) => (
            <div
              key={m._id}
              className="glass rounded-3xl card-shadow p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <MedicineIcon name={m.name} size="lg" />
                <SaveMedicationButton medicine={m} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-slate-800 dark:text-zinc-100 truncate">{m.name}</p>
                {m.genericName && (
                  <p className="text-[12px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{m.genericName}</p>
                )}
              </div>
              {m.description && (
                <p className="text-[11.5px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {m.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                {m.category && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
                    {m.category}
                  </span>
                )}
                {m.requiresPrescription ? (
                  <Badge variant="warning">
                    <ShieldCheck className="w-3 h-3 mr-1 inline" />
                    Rx required
                  </Badge>
                ) : (
                  <Badge variant="success">OTC</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

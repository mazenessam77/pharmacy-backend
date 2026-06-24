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
      <div className="rounded-[24px] p-7 mb-7 text-white relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 shadow-[0_30px_70px_-25px_rgba(13,148,136,0.55)]">
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.5) 0%, transparent 45%)' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              Medicine Catalog
            </div>
            <h1 className="text-[26px] font-black leading-tight">Browse Medicines</h1>
            <p className="text-white/80 mt-1.5 text-[13px] font-medium max-w-md">
              Tap the heart to save medicines you take often — then reorder them in one click.
            </p>
          </div>
          <Link
            href="/patient/saved"
            className="shrink-0 flex items-center gap-2 bg-white text-emerald-700 font-bold text-[13px] px-5 py-3 rounded-full hover:bg-neutral-100 active:scale-95 transition-all duration-200 shadow-lg"
          >
            <Heart className="w-4 h-4" />
            Saved
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or generic name…"
          className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-white border border-neutral-200 text-[14px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all shadow-sm"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : medicines.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-[20px] shadow-md py-16 text-center">
          <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md">
            <Pill className="w-7 h-7 text-white" />
          </div>
          <p className="text-[13px] font-medium text-neutral-500">
            {search ? `No medicines match "${search}".` : 'No medicines available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((m) => (
            <div
              key={m._id}
              className="bg-white border border-neutral-100 rounded-[20px] shadow-md p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <MedicineIcon name={m.name} size="lg" />
                <SaveMedicationButton medicine={m} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-neutral-800 truncate">{m.name}</p>
                {m.genericName && (
                  <p className="text-[12px] text-neutral-500 truncate mt-0.5">{m.genericName}</p>
                )}
              </div>
              {m.description && (
                <p className="text-[11.5px] text-neutral-500 line-clamp-2 leading-relaxed">
                  {m.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                {m.category && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
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

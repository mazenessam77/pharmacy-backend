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
              Medicine Catalog
            </div>
            <h1 className="text-[26px] font-extrabold leading-tight">Browse Medicines</h1>
            <p className="text-neutral-400/90 mt-1.5 text-[13px] font-medium max-w-md">
              Tap the heart to save medicines you take often — then reorder them in one click.
            </p>
          </div>
          <Link
            href="/patient/saved"
            className="shrink-0 flex items-center gap-2 bg-white text-neutral-900 font-bold text-[13px] px-5 py-3 rounded-none hover:bg-neutral-100 active:scale-95 transition-all duration-200"
            style={{ boxShadow: 'none' }}
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
          className="w-full pl-11 pr-4 py-3.5 rounded-none bg-white border border-neutral-200 text-[14px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-200 transition-all"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : medicines.length === 0 ? (
        <div className="glass rounded-none card-shadow py-16 text-center">
          <div className="w-16 h-16 rounded-none flex items-center justify-center mx-auto mb-4 bg-neutral-100">
            <Pill className="w-7 h-7 text-neutral-900" />
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
              className="glass rounded-none card-shadow p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
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
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-none bg-neutral-100 text-neutral-900">
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

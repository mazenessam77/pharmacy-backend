import { create } from 'zustand';
import { prescriptionService } from '@/lib/services/prescriptionService';
import { Prescription } from '@/types';
import { isActive } from '@/lib/prescriptionStatus';

interface PrescriptionState {
  items: Prescription[];
  loading: boolean;
  loaded: boolean;

  fetchList: () => Promise<void>;
  /** True while any prescription is still being processed (drives list polling). */
  hasActive: () => boolean;
  resubmit: (id: string) => Promise<void>;
}

export const usePrescriptionStore = create<PrescriptionState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,

  fetchList: async () => {
    set({ loading: true });
    try {
      const res = await prescriptionService.getAll({ limit: 50 });
      set({ items: res.data.data || [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  hasActive: () => get().items.some((p) => isActive(p.status)),

  resubmit: async (id) => {
    const res = await prescriptionService.resubmit(id);
    const updated = res.data.data.prescription;
    set((s) => ({ items: s.items.map((p) => (p._id === id ? updated : p)) }));
  },
}));

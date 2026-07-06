import { create } from 'zustand';
import { prescriptionService } from '@/lib/services/prescriptionService';
import { Prescription } from '@/types';

interface PrescriptionState {
  items: Prescription[];
  loading: boolean;
  loaded: boolean;

  fetchList: () => Promise<void>;
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
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
}));

import { create } from 'zustand';
import { savedMedicationService } from '@/lib/services/savedMedicationService';
import { Medicine, SavedMedication, ReminderFrequency } from '@/types';

interface SavedMedicationState {
  items: SavedMedication[];
  loading: boolean;
  loaded: boolean;
  busyIds: Set<string>; // medicineIds with an in-flight toggle (button disabled)

  fetch: () => Promise<void>;
  isSaved: (medicineId: string) => boolean;
  /** Optimistic save/unsave from a medicine card (heart toggle). */
  toggle: (medicine: Medicine) => Promise<void>;
  /** Remove by SavedMedication id (used on the dashboard). */
  removeById: (savedId: string) => Promise<void>;
  /** Update notes / reminder on a saved item. */
  update: (savedId: string, data: { notes?: string; reminderFrequency?: ReminderFrequency }) => Promise<void>;
}

const withBusy = (set: any, get: any, medicineId: string, on: boolean) => {
  const next = new Set<string>(get().busyIds);
  if (on) next.add(medicineId);
  else next.delete(medicineId);
  set({ busyIds: next });
};

export const useSavedMedicationStore = create<SavedMedicationState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  busyIds: new Set<string>(),

  fetch: async () => {
    set({ loading: true });
    try {
      const res = await savedMedicationService.getAll({ limit: 100 });
      set({ items: res.data.data || [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  isSaved: (medicineId) => get().items.some((i) => i.medicineId?._id === medicineId),

  toggle: async (medicine) => {
    const existing = get().items.find((i) => i.medicineId?._id === medicine._id);
    withBusy(set, get, medicine._id, true);

    try {
      if (existing) {
        // ── Optimistic unsave ──
        set((s) => ({ items: s.items.filter((i) => i._id !== existing._id) }));
        try {
          await savedMedicationService.remove(existing._id);
        } catch (e) {
          set((s) => ({ items: [existing, ...s.items] })); // revert
          throw e;
        }
      } else {
        // ── Optimistic save (temp row, swapped for the server row on success) ──
        const temp: SavedMedication = {
          _id: `temp-${medicine._id}`,
          patientId: '',
          medicineId: medicine,
          reminderFrequency: 'none',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ items: [temp, ...s.items] }));
        try {
          const res = await savedMedicationService.save({ medicineId: medicine._id });
          set((s) => ({ items: s.items.map((i) => (i._id === temp._id ? res.data.data : i)) }));
        } catch (e) {
          set((s) => ({ items: s.items.filter((i) => i._id !== temp._id) })); // revert
          throw e;
        }
      }
    } finally {
      withBusy(set, get, medicine._id, false);
    }
  },

  removeById: async (savedId) => {
    const existing = get().items.find((i) => i._id === savedId);
    set((s) => ({ items: s.items.filter((i) => i._id !== savedId) })); // optimistic
    try {
      await savedMedicationService.remove(savedId);
    } catch (e) {
      if (existing) set((s) => ({ items: [existing, ...s.items] })); // revert
      throw e;
    }
  },

  update: async (savedId, data) => {
    const res = await savedMedicationService.update(savedId, data);
    set((s) => ({ items: s.items.map((i) => (i._id === savedId ? res.data.data : i)) }));
  },
}));

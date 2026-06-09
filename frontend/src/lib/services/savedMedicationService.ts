import api from '@/lib/api';
import { SavedMedication, ReminderFrequency } from '@/types';

interface SavedListResponse {
  success: boolean;
  data: SavedMedication[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const savedMedicationService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<SavedListResponse>('/medications/saved', { params }),

  save: (data: { medicineId?: string; name?: string; notes?: string; reminderFrequency?: ReminderFrequency }) =>
    api.post<{ success: boolean; data: SavedMedication }>('/medications/saved', data),

  update: (id: string, data: { notes?: string; reminderFrequency?: ReminderFrequency }) =>
    api.patch<{ success: boolean; data: SavedMedication }>(`/medications/saved/${id}`, data),

  remove: (id: string) =>
    api.delete<{ success: boolean; data: { _id: string } }>(`/medications/saved/${id}`),
};

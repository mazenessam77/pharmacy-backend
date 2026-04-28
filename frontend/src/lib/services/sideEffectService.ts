import api from '@/lib/api';

export interface SideEffectReportInput {
  medicineName: string;
  medicineId?: string;
  condition?: string;
  sideEffects: string[];
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export const sideEffectService = {
  create: (payload: SideEffectReportInput) => api.post('/side-effects', payload),

  getMine: (params?: { page?: number; limit?: number }) =>
    api.get('/side-effects/me', { params }),

  getPending: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/side-effects/pending', { params }),

  getById: (id: string) => api.get(`/side-effects/${id}`),

  review: (id: string, decision: 'approved' | 'rejected', doctorNotes?: string) =>
    api.patch(`/side-effects/${id}/review`, { decision, doctorNotes }),

  regenerate: (id: string) => api.post(`/side-effects/${id}/regenerate`),
};

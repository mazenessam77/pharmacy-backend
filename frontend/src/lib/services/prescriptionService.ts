import api from '@/lib/api';

export const prescriptionService = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('prescription', file);
    return api.post('/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  scan: (file: File) => {
    const formData = new FormData();
    formData.append('prescription', file);
    return api.post('/prescriptions/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/prescriptions', { params }),

  getById: (id: string) =>
    api.get(`/prescriptions/${id}`),

  verify: (id: string, extractedMeds?: { name: string; confidence: number }[]) =>
    api.put(`/prescriptions/${id}/verify`, { extractedMeds }),
};

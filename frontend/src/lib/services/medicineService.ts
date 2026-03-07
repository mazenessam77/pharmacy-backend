import api from '@/lib/api';

export const medicineService = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    api.get('/medicines', { params }),

  autocomplete: (query: string) =>
    api.get('/medicines/autocomplete', { params: { q: query } }),

  getById: (id: string) =>
    api.get(`/medicines/${id}`),
};

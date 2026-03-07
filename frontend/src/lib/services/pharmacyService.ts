import api from '@/lib/api';

export const pharmacyService = {
  getNearby: (params: { lat: number; lng: number; radius?: number }) =>
    api.get('/pharmacies/nearby', { params }),

  getById: (id: string) =>
    api.get(`/pharmacies/${id}`),

  toggleStatus: () =>
    api.put('/pharmacies/status'),
};

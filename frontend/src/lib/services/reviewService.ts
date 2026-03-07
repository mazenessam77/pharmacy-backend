import api from '@/lib/api';

export const reviewService = {
  create: (data: { pharmacyId: string; orderId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),

  getByPharmacy: (pharmacyId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/reviews/pharmacy/${pharmacyId}`, { params }),
};

import api from '@/lib/api';

export const adminService = {
  getStats: () =>
    api.get('/admin/stats'),

  // Pharmacies
  getPendingPharmacies: () =>
    api.get('/admin/pharmacies/pending'),

  verifyPharmacy: (id: string, action: 'approve' | 'reject', reason?: string) =>
    api.put(`/admin/pharmacies/${id}/verify`, { action, reason }),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/admin/users', { params }),

  banUser: (id: string) =>
    api.put(`/admin/users/${id}/ban`),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),

  // Orders
  getOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/orders', { params }),

  getOrderDetail: (id: string) =>
    api.get(`/admin/orders/${id}`),

  deleteOrder: (id: string) =>
    api.delete(`/admin/orders/${id}`),

  // Pharmacies
  getAllPharmacies: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/pharmacies', { params }),

  deletePharmacy: (id: string) =>
    api.delete(`/admin/pharmacies/${id}`),

  // Medicines
  createMedicine: (data: { name: string; genericName?: string; category?: string; requiresPrescription?: boolean; description?: string }) =>
    api.post('/admin/medicines', data),

  updateMedicine: (id: string, data: Partial<{ name: string; genericName: string; category: string; requiresPrescription: boolean; description: string }>) =>
    api.put(`/admin/medicines/${id}`, data),

  deleteMedicine: (id: string) =>
    api.delete(`/admin/medicines/${id}`),
};

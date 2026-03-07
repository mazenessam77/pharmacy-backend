import api from '@/lib/api';

export const notificationService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/notifications', { params }),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put('/notifications/read-all'),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),
};

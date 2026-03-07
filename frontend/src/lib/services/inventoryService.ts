import api from '@/lib/api';

export const inventoryService = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/inventory', { params }),

  add: (data: { medicineName: string; genericName?: string; price: number; quantity: number }) =>
    api.post('/inventory', data),

  update: (id: string, data: Partial<{ medicineName: string; price: number; quantity: number; isAvailable: boolean }>) =>
    api.put(`/inventory/${id}`, data),

  delete: (id: string) =>
    api.delete(`/inventory/${id}`),

  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/inventory/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

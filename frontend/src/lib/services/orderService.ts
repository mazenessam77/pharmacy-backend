import api from '@/lib/api';
import { Order, CreateOrderData, OrderResponse, SubmitOfferData } from '@/types';

export const orderService = {
  create: (data: CreateOrderData) =>
    api.post<{ success: boolean; data: { order: Order } }>('/orders', data),

  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: { order: Order } }>(`/orders/${id}`),

  cancel: (id: string, reason?: string) =>
    api.put(`/orders/${id}/cancel`, { cancelReason: reason }),

  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),

  reorder: (id: string) =>
    api.post(`/orders/${id}/reorder`),

  // Responses (offers)
  getResponses: (orderId: string) =>
    api.get<{ success: boolean; data: { responses: OrderResponse[] } }>(`/orders/${orderId}/responses`),

  submitOffer: (orderId: string, data: SubmitOfferData) =>
    api.post(`/orders/${orderId}/responses`, data),

  acceptOffer: (orderId: string, responseId: string) =>
    api.put(`/orders/${orderId}/responses/${responseId}/accept`),
};

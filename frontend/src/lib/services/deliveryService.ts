import api from '@/lib/api';
import { TrackingSnapshot } from '@/types/delivery';

export const deliveryService = {
  /** Full tracking snapshot. 404 => no delivery has been created for the order yet. */
  getTracking: (orderId: string) =>
    api.get<{ success: boolean; data: TrackingSnapshot }>(`/deliveries/${orderId}/tracking`),

  getEta: (orderId: string) => api.get(`/deliveries/${orderId}/eta`),

  getHistory: (orderId: string) => api.get(`/deliveries/${orderId}/history`),
};

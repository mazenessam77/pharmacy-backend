import api from '@/lib/api';
import { SavedBasket } from '@/types';

export interface BasketItemInput {
  medicineId: string;
  quantity?: number;
}

interface BasketListResponse {
  success: boolean;
  data: SavedBasket[];
}

interface BasketResponse {
  success: boolean;
  data: SavedBasket;
}

export const savedBasketService = {
  getAll: () => api.get<BasketListResponse>('/baskets'),

  create: (data: { name: string; items: BasketItemInput[] }) =>
    api.post<BasketResponse>('/baskets', data),

  update: (id: string, data: { name?: string; items?: BasketItemInput[] }) =>
    api.patch<BasketResponse>(`/baskets/${id}`, data),

  remove: (id: string) =>
    api.delete<{ success: boolean; data: { _id: string } }>(`/baskets/${id}`),
};

import api from '@/lib/api';

export const messageService = {
  getHistory: (orderId: string, recipientId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/messages/${orderId}/${recipientId}`, { params }),

  send: (data: {
    orderId: string;
    receiverId: string;
    content?: string;
    messageType?: 'text' | 'image' | 'alternative';
    imageUrl?: string;
    alternativeData?: {
      originalMedicine: string;
      suggestedMedicine: string;
      suggestedPrice: number;
    };
  }) => api.post('/messages', data),

  markRead: (messageId: string) =>
    api.put(`/messages/${messageId}/read`),

  markAllRead: (orderId: string) =>
    api.put(`/messages/read-all/${orderId}`),
};

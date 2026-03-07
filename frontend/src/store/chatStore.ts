import { create } from 'zustand';
import { messageService } from '@/lib/services/messageService';
import { Message } from '@/types';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  typingUsers: Set<string>;

  fetchMessages: (orderId: string, recipientId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  sendMessage: (data: {
    orderId: string;
    receiverId: string;
    content: string;
  }) => Promise<void>;
  markAllRead: (orderId: string) => Promise<void>;
  setTyping: (userId: string, isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  typingUsers: new Set(),

  fetchMessages: async (orderId, recipientId) => {
    set({ isLoading: true });
    try {
      const res = await messageService.getHistory(orderId, recipientId, { limit: 100 });
      const messages = res.data.data?.messages || res.data.data || [];
      set({ messages: messages.reverse() });
    } catch {
      // silent
    } finally {
      set({ isLoading: false });
    }
  },

  addMessage: (message) => {
    set((state) => {
      if (state.messages.some((m) => m._id === message._id)) return state;
      return { messages: [...state.messages, message] };
    });
  },

  sendMessage: async (data) => {
    await messageService.send({ ...data, messageType: 'text' });
  },

  markAllRead: async (orderId) => {
    await messageService.markAllRead(orderId);
  },

  setTyping: (userId, isTyping) => {
    set((state) => {
      const typingUsers = new Set(state.typingUsers);
      if (isTyping) typingUsers.add(userId);
      else typingUsers.delete(userId);
      return { typingUsers };
    });
  },

  clearMessages: () => set({ messages: [], typingUsers: new Set() }),
}));

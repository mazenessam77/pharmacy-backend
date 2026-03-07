import { create } from 'zustand';
import { orderService } from '@/lib/services/orderService';
import { Order, OrderResponse, CreateOrderData } from '@/types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  responses: OrderResponse[];
  isLoading: boolean;
  pagination: { page: number; pages: number; total: number };

  fetchOrders: (params?: { page?: number; status?: string }) => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  createOrder: (data: CreateOrderData) => Promise<Order>;
  cancelOrder: (id: string, reason?: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  fetchResponses: (orderId: string) => Promise<void>;
  acceptOffer: (orderId: string, responseId: string) => Promise<void>;
  updateOrderInList: (order: Order) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  responses: [],
  isLoading: false,
  pagination: { page: 1, pages: 1, total: 0 },

  fetchOrders: async (params) => {
    set({ isLoading: true });
    try {
      const res = await orderService.getAll(params);
      set({
        orders: res.data.data?.orders || res.data.data || [],
        pagination: res.data.pagination || { page: 1, pages: 1, total: 0 },
      });
    } catch {
      // silent
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrder: async (id) => {
    set({ isLoading: true });
    try {
      const res = await orderService.getById(id);
      set({ currentOrder: res.data.data?.order || res.data.data });
    } catch {
      // silent
    } finally {
      set({ isLoading: false });
    }
  },

  createOrder: async (data) => {
    set({ isLoading: true });
    try {
      const res = await orderService.create(data);
      const order = res.data.data?.order || res.data.data;
      set((state) => ({ orders: [order, ...state.orders] }));
      return order;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelOrder: async (id, reason) => {
    await orderService.cancel(id, reason);
    set((state) => ({
      orders: state.orders.map((o) =>
        o._id === id ? { ...o, status: 'cancelled' as const } : o
      ),
      currentOrder: state.currentOrder?._id === id
        ? { ...state.currentOrder, status: 'cancelled' as const }
        : state.currentOrder,
    }));
  },

  updateStatus: async (id, status) => {
    await orderService.updateStatus(id, status);
    set((state) => ({
      orders: state.orders.map((o) =>
        o._id === id ? { ...o, status: status as Order['status'] } : o
      ),
      currentOrder: state.currentOrder?._id === id
        ? { ...state.currentOrder, status: status as Order['status'] }
        : state.currentOrder,
    }));
  },

  fetchResponses: async (orderId) => {
    try {
      const res = await orderService.getResponses(orderId);
      set({ responses: res.data.data?.responses || res.data.data || [] });
    } catch {
      // silent
    }
  },

  acceptOffer: async (orderId, responseId) => {
    await orderService.acceptOffer(orderId, responseId);
    set((state) => ({
      responses: state.responses.map((r) =>
        r._id === responseId
          ? { ...r, status: 'accepted' as const }
          : { ...r, status: 'rejected' as const }
      ),
      currentOrder: state.currentOrder
        ? { ...state.currentOrder, status: 'confirmed' as const }
        : null,
    }));
  },

  updateOrderInList: (order) => {
    set((state) => ({
      orders: state.orders.map((o) => (o._id === order._id ? order : o)),
      currentOrder: state.currentOrder?._id === order._id ? order : state.currentOrder,
    }));
  },
}));

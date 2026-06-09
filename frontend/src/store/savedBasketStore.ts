import { create } from 'zustand';
import { savedBasketService, BasketItemInput } from '@/lib/services/savedBasketService';
import { SavedBasket } from '@/types';

interface SavedBasketState {
  baskets: SavedBasket[];
  loading: boolean;
  loaded: boolean;

  fetch: () => Promise<void>;
  create: (data: { name: string; items: BasketItemInput[] }) => Promise<SavedBasket>;
  update: (id: string, data: { name?: string; items?: BasketItemInput[] }) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSavedBasketStore = create<SavedBasketState>((set, get) => ({
  baskets: [],
  loading: false,
  loaded: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const res = await savedBasketService.getAll();
      set({ baskets: res.data.data || [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  create: async (data) => {
    const res = await savedBasketService.create(data);
    const basket = res.data.data;
    set((s) => ({ baskets: [basket, ...s.baskets] }));
    return basket;
  },

  update: async (id, data) => {
    const res = await savedBasketService.update(id, data);
    set((s) => ({ baskets: s.baskets.map((b) => (b._id === id ? res.data.data : b)) }));
  },

  remove: async (id) => {
    const existing = get().baskets.find((b) => b._id === id);
    set((s) => ({ baskets: s.baskets.filter((b) => b._id !== id) })); // optimistic
    try {
      await savedBasketService.remove(id);
    } catch (e) {
      if (existing) set((s) => ({ baskets: [existing, ...s.baskets] })); // revert
      throw e;
    }
  },
}));

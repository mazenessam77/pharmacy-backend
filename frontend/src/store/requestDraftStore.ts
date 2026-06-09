import { create } from 'zustand';

export interface DraftMedicine {
  name: string;
  quantity: number;
}

/**
 * A one-shot hand-off for pre-filling the new-request page (/patient/orders/new).
 * "Order Basket" drops the basket's items here and navigates; the request page
 * consumes them once on mount (so a refresh doesn't silently re-apply them).
 * Nothing is sent to the backend — the patient still reviews, edits quantities,
 * and submits the request themselves.
 */
interface RequestDraftState {
  items: DraftMedicine[] | null;
  load: (items: DraftMedicine[]) => void;
  /** Return the pending draft (if any) and clear it. */
  consume: () => DraftMedicine[] | null;
}

export const useRequestDraftStore = create<RequestDraftState>((set, get) => ({
  items: null,
  load: (items) => set({ items }),
  consume: () => {
    const { items } = get();
    if (items) set({ items: null });
    return items;
  },
}));

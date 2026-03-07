import { OrderStatus } from '@/types';

export function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: 'Pending',
    offered: 'Offers Available',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
}

export function statusVariant(status: OrderStatus) {
  if (status === 'delivered') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  if (['preparing', 'out_for_delivery', 'confirmed'].includes(status)) return 'warning' as const;
  return 'default' as const;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import Button from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/helpers';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function PharmacyNotificationsPage() {
  const { notifications, isLoading, fetch, markRead, markAllRead, remove } = useNotificationStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Inbox</p>
          <h1 className="text-[28px] font-light uppercase tracking-wide">Notifications</h1>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="w-3 h-3" />
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : notifications.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`border p-5 flex items-start gap-4 transition-colors ${
                notif.isRead ? 'border-neutral-100 bg-white' : 'border-neutral-300 bg-neutral-50'
              }`}
            >
              <div className={`w-1.5 h-1.5 mt-2 flex-shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-black'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{notif.title}</p>
                <p className="text-[12px] text-neutral-500 mt-0.5">{notif.body}</p>
                <p className="text-[10px] text-neutral-400 mt-1">{formatDateTime(notif.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                {!notif.isRead && (
                  <button onClick={() => markRead(notif._id)} className="text-neutral-300 hover:text-black transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => remove(notif._id)} className="text-neutral-300 hover:text-black transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

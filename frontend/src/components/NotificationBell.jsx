import { useState } from 'react';
import { useNotifications, useUnreadCount, useMarkAllRead } from '../hooks/useNotifications.js';
import { notificationMessage as messageFor } from '../utils/notificationMessage.js';
import Icon from './ui/Icon.jsx';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread } = useUnreadCount();
  const { data: list } = useNotifications({ pageSize: 8 });
  const markAllRead = useMarkAllRead();
  const count = unread?.count ?? 0;
  const items = list?.data ?? [];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
        aria-label="Notifications"
      >
        <Icon name="bell" className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-ink-950">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 animate-scale-in overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-popover dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-2.5 dark:border-ink-800">
              <span className="text-sm font-semibold">Notifications</span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto scrollbar-thin dark:divide-ink-800">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-ink-400">No notifications.</li>
              ) : (
                items.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 text-sm ${
                      n.readAt ? 'text-ink-500' : 'bg-brand-50/50 dark:bg-brand-500/10'
                    }`}
                  >
                    <p>{messageFor(n)}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

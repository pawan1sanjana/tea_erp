import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock3, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = items.filter((item) => !item.isRead).length;

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await apiClient.get('/notifications');
        if (response.success) setItems(response.data);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const markAllRead = () => {
    setItems(items.map((item) => ({ ...item, isRead: true })));
  };

  return (
    <div className="space-y-6">
      <div className="premium-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tea-100 text-tea-700 dark:bg-tea-500/10 dark:text-tea-300 text-sm font-semibold">
              <Bell size={18} /> Notifications
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white font-outfit">Notification Center</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
              Stay on top of estate alerts, attendance updates, weather warnings, and maintenance notices in one unified view.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={markAllRead}
              className="btn-secondary px-5 py-2"
            >
              Mark all read
            </button>
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {unreadCount} unread
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-3xl p-5 border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-500">
            Loading notifications...
          </div>
        ) : (
          items.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-3xl p-5 border ${notification.isRead ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300' : 'border-tea-200 bg-tea-50 text-slate-900 dark:border-tea-500/40 dark:bg-tea-500/10 dark:text-white'} transition-colors`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">
                    {notification.type}
                  </p>
                  <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                    {notification.title}
                  </h2>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock3 size={16} />
                  {notification.time}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {notification.message}
              </p>
              {!notification.isRead && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-tea-600/10 px-3 py-2 text-sm font-medium text-tea-700 dark:bg-tea-400/10 dark:text-tea-200">
                  <CheckCircle2 size={16} /> Marked unread
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="premium-card p-6 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
          <ArrowRight size={18} />
          <p className="text-sm">
            Tip: Use the notification bell in the header to access quick alerts from anywhere in the app.
          </p>
        </div>
      </div>
    </div>
  );
}

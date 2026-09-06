'use client';

import { useState, useEffect, useRef } from 'react';
import type { NotificationDto } from '@ai-platform/types';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../lib/notifications';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotificationData = async () => {
    try {
      const [countRes, notifs] = await Promise.all([
        getUnreadNotificationCount().catch(() => ({ unreadCount: 0 })),
        getNotifications().catch(() => []),
      ]);
      setUnreadCount(countRes.unreadCount);
      setNotifications(notifs);
    } catch {
      // Ignored if user not logged in
    }
  };

  useEffect(() => {
    fetchNotificationData();
    const interval = setInterval(fetchNotificationData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'achievement':
        return '🏆';
      case 'subscription':
      case 'payment':
        return '💳';
      case 'streak':
        return '🔥';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/80 text-slate-300 transition-colors hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-[11px] font-bold text-white shadow-lg shadow-pink-500/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`group relative flex cursor-pointer gap-3 rounded-xl p-3 transition-colors ${
                    n.isRead
                      ? 'bg-slate-800/30 hover:bg-slate-800/50'
                      : 'border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40'
                  }`}
                >
                  <div className="text-xl shrink-0 mt-0.5">{getTypeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

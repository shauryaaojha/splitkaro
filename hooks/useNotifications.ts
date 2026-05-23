'use client';

import useSWR from 'swr';
import { useCallback } from 'react';

interface Notification {
  _id: string;
  userId: string;
  type: 'expense_added' | 'settled' | 'group_joined' | 'friend_request' | 'friend_accepted';
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

const fetcher = async (url: string): Promise<Notification[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load notifications' }));
    throw new Error(err.error || 'Failed to load notifications');
  }
  const json = await res.json();
  return json.data;
};

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    '/api/notifications',
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000,
    }
  );

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/read', { method: 'PUT' });
      mutate(
        notifications.map((n) => ({ ...n, isRead: true })),
        false
      );
    } catch {
      // silently fail, will re-fetch
    }
  }, [notifications, mutate]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error: error as Error | null,
    markAllRead,
    mutate,
  };
}

export type { Notification };

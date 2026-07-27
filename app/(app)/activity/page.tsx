'use client';

import React, { useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import ActivityItem from '@/components/home/ActivityItem';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/hooks/useNotifications';

export default function ActivityPage() {
  const { notifications, isLoading, error, markAllRead } = useNotifications();

  // Mark all notifications as read on page load
  useEffect(() => {
    if (notifications.some((n) => !n.isRead)) {
      markAllRead();
    }
  }, [notifications, markAllRead]);

  // Group notifications by date
  const groupNotifications = () => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    notifications.forEach((item) => {
      const time = new Date(item.createdAt).getTime();
      if (time >= startOfToday) {
        today.push(item);
      } else if (time >= startOfYesterday) {
        yesterday.push(item);
      } else {
        older.push(item);
      }
    });

    return { today, yesterday, older };
  };

  const groups = groupNotifications();

  const renderSection = (title: string, list: Notification[]) => {
    if (list.length === 0) return null;
    return (
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-ink-muted px-1">
          {title}
        </span>
        <Card className="flex flex-col p-2 bg-white border-2 border-ink divide-y divide-soft">
          {list.map((item) => (
            <ActivityItem key={item._id} activity={item} />
          ))}
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-16 min-h-screen">
      {/* Top Bar */}
      <TopBar title="Activity Log" />

      {/* Header */}
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-ink-muted">
          Timeline
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-ink leading-tight">
          Recent Activities
        </h2>
        <p className="text-sm font-semibold text-ink-muted mt-0.5 leading-snug">
          Keep track of added expenses, settlements, and invites.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="w-full h-16 rounded-xl" />
          <Skeleton className="w-full h-16 rounded-xl" />
          <Skeleton className="w-full h-16 rounded-xl" />
        </div>
      ) : error ? (
        <div className="border-2 border-danger bg-danger-soft text-danger p-4 rounded-xl font-bold font-['Space_Grotesk'] text-sm text-center">
          Failed to load activities.
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-card border-2 border-ink rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-center text-ink-muted">
          <span className="material-symbols-outlined text-5xl mb-4 text-ink-muted/40">
            notifications_off
          </span>
          <span className="text-base font-bold font-['Space_Grotesk'] text-ink">
            Your logs are clean
          </span>
          <span className="text-xs text-ink-muted/70 mt-1 max-w-[220px]">
            Activity updates about expense shares and peer requests will compile here!
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-6 pb-12">
          {renderSection('Today', groups.today)}
          {renderSection('Yesterday', groups.yesterday)}
          {renderSection('Older Activities', groups.older)}
        </div>
      )}
    </div>
  );
}

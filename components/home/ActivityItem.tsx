'use client';

import React from 'react';

type NotificationType =
  | 'expense_added'
  | 'settled'
  | 'group_joined'
  | 'friend_request'
  | 'friend_accepted';

interface ActivityItemProps {
  activity: {
    _id: string;
    type: NotificationType;
    message: string;
    isRead: boolean;
    createdAt: string | Date;
  };
}

const typeConfig: Record<
  NotificationType,
  { icon: string; bgVar: string; colorVar: string }
> = {
  expense_added: {
    icon: 'receipt_long',
    bgVar: 'var(--t-danger-bg)',
    colorVar: 'var(--t-danger)',
  },
  settled: {
    icon: 'handshake',
    bgVar: 'var(--t-success-bg)',
    colorVar: 'var(--t-success)',
  },
  group_joined: {
    icon: 'groups',
    bgVar: 'var(--t-accent-container)',
    colorVar: 'var(--t-accent)',
  },
  friend_request: {
    icon: 'person_add',
    bgVar: 'rgba(255, 222, 166, 0.3)',
    colorVar: 'var(--t-warning)',
  },
  friend_accepted: {
    icon: 'person_outline',
    bgVar: 'var(--t-success-bg)',
    colorVar: 'var(--t-success)',
  },
};

export default function ActivityItem({ activity }: ActivityItemProps) {
  const config = typeConfig[activity.type] || {
    icon: 'notifications',
    bgVar: 'var(--t-surface-3)',
    colorVar: 'var(--t-on-surface)',
  };

  const formattedDate = new Date(activity.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="flex items-start gap-3.5 py-3 px-4 rounded-xl transition-all"
      style={{
        background: !activity.isRead ? `color-mix(in srgb, var(--t-primary) 8%, transparent)` : 'transparent',
        borderLeft: !activity.isRead ? '3px solid var(--t-primary)' : '3px solid transparent',
      }}
    >
      {/* Icon Circle */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: config.bgVar,
          border: '2px solid var(--t-border)',
          boxShadow: '1px 1px 0px 0px var(--t-shadow)',
        }}
      >
        <span
          className="material-symbols-outlined font-semibold text-[20px]"
          style={{ color: config.colorVar }}
        >
          {config.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-semibold leading-tight break-words font-['DM_Sans']" style={{ color: 'var(--t-on-surface)' }}>
          {activity.message}
        </span>
        <span className="text-[10px] font-bold font-['Space_Grotesk'] uppercase tracking-wider" style={{ color: 'var(--t-on-surface-muted)' }}>
          {formattedDate}
        </span>
      </div>

      {/* Unread indicator dot */}
      {!activity.isRead && (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-2"
          style={{ background: 'var(--t-primary)', border: '1px solid var(--t-border)' }}
        />
      )}
    </div>
  );
}

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
  { icon: string; bg: string; color: string }
> = {
  expense_added: {
    icon: 'receipt_long',
    bg: 'bg-[#ffdbd0]',
    color: 'text-[#aa3000]',
  },
  settled: {
    icon: 'handshake',
    bg: 'bg-[#E8F8EE]',
    color: 'text-[#1b6d30]',
  },
  group_joined: {
    icon: 'groups',
    bg: 'bg-[#e3e1f9]',
    color: 'text-[#5d5c74]',
  },
  friend_request: {
    icon: 'person_add',
    bg: 'bg-[#fffdea]',
    color: 'text-[#7d5800]',
  },
  friend_accepted: {
    icon: 'person_outline',
    bg: 'bg-[#E8F8EE]',
    color: 'text-[#1b6d30]',
  },
};

export default function ActivityItem({ activity }: ActivityItemProps) {
  const config = typeConfig[activity.type] || {
    icon: 'notifications',
    bg: 'bg-[#eae7e7]',
    color: 'text-[#1c1b1b]',
  };

  const formattedDate = new Date(activity.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={[
        'flex items-start gap-3.5 py-3 px-4 border-2 border-transparent transition-all rounded-xl',
        !activity.isRead
          ? 'bg-[#ffdbd0]/10 border-l-4 border-l-[#aa3000]'
          : 'hover:bg-[#eae7e7]/30',
      ].join(' ')}
    >
      {/* Icon Circle */}
      <div
        className={[
          'w-10 h-10 rounded-full border-2 border-[#1c1b1b] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]',
          config.bg,
        ].join(' ')}
      >
        <span
          className={[
            'material-symbols-outlined font-semibold text-[20px]',
            config.color,
          ].join(' ')}
        >
          {config.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-semibold text-[#1c1b1b] leading-tight break-words font-['DM_Sans']">
          {activity.message}
        </span>
        <span className="text-[10px] font-bold text-[#5d5c74] font-['Space_Grotesk'] uppercase tracking-wider">
          {formattedDate}
        </span>
      </div>

      {/* Unread indicator dot */}
      {!activity.isRead && (
        <span className="w-2.5 h-2.5 bg-[#aa3000] border border-[#1c1b1b] rounded-full shrink-0 mt-2" />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import TopBar from '@/components/layout/TopBar';
import BalanceSummaryCard from '@/components/home/BalanceSummaryCard';
import ActivityItem from '@/components/home/ActivityItem';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import InviteModal from '@/components/home/InviteModal';

interface DashboardData {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  balances: {
    user: {
      _id: string;
      name: string;
      email: string;
      upiId: string;
      avatarUrl?: string;
    };
    amount: number;
  }[];
}

const dashboardFetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch dashboard data' }));
    throw new Error(err.error || 'Failed to fetch dashboard data');
  }
  const json = await res.json();
  return json.data;
};

export default function HomeDashboard() {
  const { user } = useAuth();
  const { notifications, isLoading: loadingNotifications } = useNotifications();
  const [showInvite, setShowInvite] = useState(false);

  const { data: dashboard, isLoading: loadingDashboard } = useSWR<DashboardData>(
    '/api/dashboard/balances',
    dashboardFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 15000,
    }
  );

  const greetingName = user?.name.split(' ')[0] || 'User';

  // Get first 4 recent activities
  const recentActivities = notifications.slice(0, 4);

  const quickActions = [
    {
      href: '/groups',
      icon: 'add_circle',
      label: 'Add Exp',
      primary: true,
    },
    {
      href: '/groups/new',
      icon: 'group_add',
      label: 'New Grp',
      primary: false,
    },
    {
      href: '/groups',
      icon: 'handshake',
      label: 'Settle',
      primary: false,
    },
    {
      href: '/friends',
      icon: 'person_add',
      label: 'Friends',
      primary: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6 pt-16">
      {/* Premium Top Bar with User Info and Notifications Button */}
      <TopBar
        rightAction={
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-95 transition-opacity"
            >
              <Avatar
                name={user?.name || 'User'}
                src={user?.avatarUrl}
                size="sm"
              />
              <span className="hidden sm:inline font-bold font-['Space_Grotesk'] text-sm" style={{ color: 'var(--t-on-surface)' }}>
                {greetingName}
              </span>
            </Link>
            <Link
              href="/activity"
              className={[
                'w-10 h-10 flex items-center justify-center rounded-full relative',
                'active:translate-x-[1px] active:translate-y-[1px]',
                'transition-all duration-100 cursor-pointer',
              ].join(' ')}
              style={{
                border: '2px solid var(--t-border)',
                background: 'var(--t-card-bg)',
                boxShadow: '2px 2px 0px 0px var(--t-shadow)',
              }}
              aria-label="Activity logs"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--t-on-surface)' }}>
                notifications
              </span>
              {notifications.some((n) => !n.isRead) && (
                <span className="absolute top-0 right-0 w-3 h-3 border-2 border-white rounded-full" style={{ background: 'var(--t-primary)' }} />
              )}
            </Link>
          </div>
        }
      />

      {/* Greeting Header */}
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>
          Welcome Back
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] leading-tight" style={{ color: 'var(--t-on-surface)' }}>
          Hey {greetingName}! 👋
        </h2>
      </div>

      {/* Dynamic Consolidated Balance Card */}
      {loadingDashboard ? (
        <Skeleton className="w-full h-[200px] rounded-2xl" />
      ) : dashboard ? (
        <BalanceSummaryCard
          totalOwed={dashboard.totalOwed}
          totalOwing={dashboard.totalOwing}
          netBalance={dashboard.netBalance}
        />
      ) : null}

      {/* Scrollable Quick Actions Slider */}
      <section className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] px-1" style={{ color: 'var(--t-on-surface-muted)' }}>
          Quick Actions
        </span>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2 px-1">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex-none flex flex-col items-center justify-center w-24 h-24 rounded-xl active:translate-x-[1px] active:translate-y-[1px] transition-all"
              style={action.primary ? {
                background: 'var(--t-primary)',
                color: '#fff',
                border: '2px solid var(--t-border)',
                boxShadow: '2px 2px 0px 0px var(--t-shadow)',
              } : {
                background: 'var(--t-card-bg)',
                color: 'var(--t-on-surface)',
                border: '2px solid var(--t-border)',
                boxShadow: '2px 2px 0px 0px var(--t-shadow)',
              }}
            >
              <span className="material-symbols-outlined mb-1 text-[28px]" style={{ color: action.primary ? '#fff' : 'var(--t-accent)' }}>
                {action.icon}
              </span>
              <span className="text-xs font-bold font-['Space_Grotesk'] tracking-wide">
                {action.label}
              </span>
            </Link>
          ))}

          {/* Invite to App button */}
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="flex-none flex flex-col items-center justify-center w-24 h-24 rounded-xl active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            style={{
              background: 'var(--t-card-bg)',
              color: 'var(--t-on-surface)',
              border: '2px solid var(--t-border)',
              boxShadow: '2px 2px 0px 0px var(--t-shadow)',
            }}
          >
            <span className="material-symbols-outlined mb-1 text-[28px]" style={{ color: 'var(--t-accent)' }}>
              send
            </span>
            <span className="text-xs font-bold font-['Space_Grotesk'] tracking-wide">
              Invite
            </span>
          </button>
        </div>
      </section>

      {/* Recent Activity List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>
            Recent Activity
          </span>
          <Link
            href="/activity"
            className="text-xs font-bold font-['Space_Grotesk'] hover:underline"
            style={{ color: 'var(--t-primary)' }}
          >
            View All
          </Link>
        </div>

        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'var(--t-card-bg)',
            border: '2px solid var(--t-border)',
            boxShadow: '2px 2px 0px 0px var(--t-shadow)',
          }}
        >
          {loadingNotifications ? (
            <div className="flex flex-col p-4 gap-3">
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4" style={{ color: 'var(--t-on-surface-muted)' }}>
              <span className="material-symbols-outlined text-4xl mb-2" style={{ opacity: 0.4 }}>
                notifications_off
              </span>
              <span className="text-sm font-bold font-['Space_Grotesk']">
                No recent activity
              </span>
              <span className="text-xs mt-1 text-center" style={{ opacity: 0.7 }}>
                Expenses and settlements inside groups will appear here!
              </span>
            </div>
          ) : (
            <div className="flex flex-col p-2 divide-y" style={{ borderColor: 'var(--t-surface-3)' }}>
              {recentActivities.map((act) => (
                <ActivityItem key={act._id} activity={act} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Invite Modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import TopBar from '@/components/layout/TopBar';
import BalanceSummaryCard from '@/components/home/BalanceSummaryCard';
import ActivityItem from '@/components/home/ActivityItem';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';

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
              <span className="hidden sm:inline font-bold font-['Space_Grotesk'] text-sm text-[#1c1b1b]">
                {greetingName}
              </span>
            </Link>
            <Link
              href="/activity"
              className={[
                'w-10 h-10 flex items-center justify-center rounded-full relative',
                'border-2 border-[#1c1b1b] bg-white shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
                'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]',
                'transition-all duration-100 cursor-pointer',
              ].join(' ')}
              aria-label="Activity logs"
            >
              <span className="material-symbols-outlined text-[22px] text-[#1c1b1b]">
                notifications
              </span>
              {notifications.some((n) => !n.isRead) && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-[#aa3000] border-2 border-white rounded-full" />
              )}
            </Link>
          </div>
        }
      />

      {/* Greeting Header */}
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
          Welcome Back
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] leading-tight">
          Hey {greetingName}! 👋
        </h2>
      </div>

      {/* Dynamic Consolidated Balance Card */}
      {loadingDashboard ? (
        <Skeleton className="w-full h-[180px] rounded-2xl border-2 border-[#1c1b1b]" />
      ) : dashboard ? (
        <BalanceSummaryCard
          totalOwed={dashboard.totalOwed}
          totalOwing={dashboard.totalOwing}
          netBalance={dashboard.netBalance}
        />
      ) : null}

      {/* Scrollable Quick Actions Slider */}
      <section className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] px-1">
          Quick Actions
        </span>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2 px-1">
          {/* Add Expense (directs to group list to pick a group) */}
          <Link
            href="/groups"
            className="flex-none flex flex-col items-center justify-center w-24 h-24 bg-[#aa3000] text-white rounded-xl border-2 border-[#1c1b1b] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition-all"
          >
            <span className="material-symbols-outlined mb-1 text-[28px]">
              add_circle
            </span>
            <span className="text-xs font-bold font-['Space_Grotesk'] tracking-wide">
              Add Exp
            </span>
          </Link>

          {/* Create New Group */}
          <Link
            href="/groups/new"
            className="flex-none flex flex-col items-center justify-center w-24 h-24 bg-white text-[#1c1b1b] rounded-xl border-2 border-[#1c1b1b] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition-all hover:bg-[#eae7e7]/30"
          >
            <span className="material-symbols-outlined mb-1 text-[28px] text-[#5d5c74]">
              group_add
            </span>
            <span className="text-xs font-bold font-['Space_Grotesk'] tracking-wide">
              New Grp
            </span>
          </Link>

          {/* Quick Settlements */}
          <Link
            href="/groups"
            className="flex-none flex flex-col items-center justify-center w-24 h-24 bg-white text-[#1c1b1b] rounded-xl border-2 border-[#1c1b1b] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition-all hover:bg-[#eae7e7]/30"
          >
            <span className="material-symbols-outlined mb-1 text-[28px] text-[#5d5c74]">
              handshake
            </span>
            <span className="text-xs font-bold font-['Space_Grotesk'] tracking-wide">
              Settle
            </span>
          </Link>

          {/* Friends Tab */}
          <Link
            href="/friends"
            className="flex-none flex flex-col items-center justify-center w-24 h-24 bg-white text-[#1c1b1b] rounded-xl border-2 border-[#1c1b1b] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition-all hover:bg-[#eae7e7]/30"
          >
            <span className="material-symbols-outlined mb-1 text-[28px] text-[#5d5c74]">
              person_add
            </span>
            <span className="text-xs font-bold font-['Space_Grotesk'] tracking-wide">
              Add Friend
            </span>
          </Link>
        </div>
      </section>

      {/* Recent Activity List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
            Recent Activity
          </span>
          <Link
            href="/activity"
            className="text-xs font-bold font-['Space_Grotesk'] text-[#aa3000] hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] overflow-hidden flex flex-col">
          {loadingNotifications ? (
            <div className="flex flex-col p-4 gap-3">
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-[#5d5c74]">
              <span className="material-symbols-outlined text-4xl mb-2 text-[#5d5c74]/50">
                notifications_off
              </span>
              <span className="text-sm font-bold font-['Space_Grotesk']">
                No recent activity
              </span>
              <span className="text-xs text-[#5d5c74]/70 mt-1 text-center">
                Expenses and settlements inside groups will appear here!
              </span>
            </div>
          ) : (
            <div className="flex flex-col p-2 divide-y divide-[#eae7e7]">
              {recentActivities.map((act) => (
                <ActivityItem key={act._id} activity={act} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

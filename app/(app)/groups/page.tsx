'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import TopBar from '@/components/layout/TopBar';
import GroupCard from '@/components/groups/GroupCard';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

interface GroupData {
  id: string;
  name: string;
  category: string;
  emoji: string;
  members: { name: string; avatarUrl?: string }[];
  balance: number;
}

const groupsFetcher = async (url: string): Promise<GroupData[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch groups' }));
    throw new Error(err.error || 'Failed to fetch groups');
  }
  const json = await res.json();
  return json.data;
};

export default function GroupsPage() {
  const { data: groups, error, isLoading } = useSWR<GroupData[]>(
    '/api/groups',
    groupsFetcher,
    { revalidateOnFocus: true }
  );

  return (
    <div className="flex flex-col gap-6 pt-16 min-h-screen">
      {/* Top bar with new group action */}
      <TopBar
        title="SplitKaro"
        rightAction={
          <Link href="/groups/new">
            <Button variant="ghost" size="sm" icon="add">
              New
            </Button>
          </Link>
        }
      />

      {/* Header and Subtext */}
      <div className="flex flex-col">
        <span
          className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']"
          style={{ color: 'var(--t-on-surface-muted)' }}
        >
          Shared Ledgers
        </span>
        <h2
          className="text-2xl font-bold font-['Space_Grotesk'] leading-tight"
          style={{ color: 'var(--t-on-surface)' }}
        >
          Groups
        </h2>
        <p
          className="text-sm font-semibold mt-0.5 leading-snug"
          style={{ color: 'var(--t-on-surface-muted)' }}
        >
          Track and settle expenses with friends and roommates.
        </p>
      </div>

      {/* Groups List container */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="w-full h-28 rounded-2xl" />
            <Skeleton className="w-full h-28 rounded-2xl" />
            <Skeleton className="w-full h-28 rounded-2xl" />
          </div>
        ) : error ? (
          <div
            className="p-4 rounded-2xl font-bold font-['Space_Grotesk'] text-sm text-center"
            style={{
              border: '2px solid var(--t-danger)',
              background: 'var(--t-danger-bg)',
              color: 'var(--t-danger)',
            }}
          >
            Failed to load groups. Please try again.
          </div>
        ) : !groups || groups.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl text-center"
            style={{
              background: 'var(--t-card-bg)',
              border: '2px solid var(--t-border)',
              boxShadow: '2px 2px 0px 0px var(--t-shadow)',
              color: 'var(--t-on-surface-muted)',
            }}
          >
            <span
              className="material-symbols-outlined text-5xl mb-4"
              style={{ color: 'var(--t-on-surface-muted)', opacity: 0.4 }}
            >
              group_off
            </span>
            <span
              className="text-base font-bold font-['Space_Grotesk']"
              style={{ color: 'var(--t-on-surface)' }}
            >
              No active groups
            </span>
            <span className="text-xs mt-1 max-w-[240px]" style={{ opacity: 0.7 }}>
              Create a group to start sharing expenses and splitting bills effortlessly!
            </span>
            <Link href="/groups/new" className="mt-6">
              <Button variant="primary" size="md" icon="add">
                Create Group
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for Mobile screens */}
      {groups && groups.length > 0 && (
        <Link
          href="/groups/new"
          className="fixed bottom-28 right-6 z-40 md:hidden"
        >
          <button
            type="button"
            className="w-14 h-14 text-white rounded-full border-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center cursor-pointer font-bold"
            style={{
              background: 'var(--t-primary)',
              borderColor: 'var(--t-border)',
              boxShadow: '3px 3px 0px 0px var(--t-shadow)',
            }}
            title="Create Group"
          >
            <span className="material-symbols-outlined text-[28px] font-extrabold">
              add
            </span>
          </button>
        </Link>
      )}
    </div>
  );
}

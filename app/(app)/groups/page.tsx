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
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
          Shared Ledgers
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] leading-tight">
          Groups
        </h2>
        <p className="text-sm font-semibold text-[#5d5c74] mt-0.5 leading-snug">
          Track and settle expenses with friends and roommates.
        </p>
      </div>

      {/* Groups List container */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="w-full h-28 rounded-2xl border-2 border-[#1c1b1b]" />
            <Skeleton className="w-full h-28 rounded-2xl border-2 border-[#1c1b1b]" />
            <Skeleton className="w-full h-28 rounded-2xl border-2 border-[#1c1b1b]" />
          </div>
        ) : error ? (
          <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] text-[#ba1a1a] p-4 rounded-2xl font-bold font-['Space_Grotesk'] text-sm text-center">
            Failed to load groups. Please try again.
          </div>
        ) : !groups || groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-center text-[#5d5c74]">
            <span className="material-symbols-outlined text-5xl mb-4 text-[#5d5c74]/40">
              group_off
            </span>
            <span className="text-base font-bold font-['Space_Grotesk'] text-[#1c1b1b]">
              No active groups
            </span>
            <span className="text-xs text-[#5d5c74]/70 mt-1 max-w-[240px]">
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
            className="w-14 h-14 bg-[#aa3000] text-white rounded-full border-2 border-[#1c1b1b] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#c45a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center cursor-pointer font-bold"
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

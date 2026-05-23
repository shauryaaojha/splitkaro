'use client';

import useSWR from 'swr';

interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  upiId?: string;
}

interface Group {
  _id: string;
  name: string;
  category: 'food' | 'trip' | 'home' | 'fun' | 'other';
  emoji: string;
  inviteToken: string;
  members: GroupMember[];
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = async (url: string): Promise<Group> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load group' }));
    throw new Error(err.error || 'Failed to load group');
  }
  const json = await res.json();
  return json.data;
};

export function useGroup(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Group>(
    id ? `/api/groups/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    group: data ?? null,
    isLoading,
    error: error as Error | null,
    mutate,
  };
}

'use client';

import useSWR from 'swr';

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  upiId: string;
  avatarUrl?: string;
  friends: string[];
  friendRequests?: {
    from: {
      _id: string;
      name: string;
      email: string;
      upiId: string;
      avatarUrl?: string;
    } | string;
    status: 'pending' | 'accepted' | 'declined';
  }[];
  createdAt: string;
}

const fetcher = async (url: string): Promise<AuthUser> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unauthorized' }));
    throw new Error(err.error || 'Unauthorized');
  }
  const json = await res.json();
  return json.data;
};

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<AuthUser>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 30000,
    }
  );

  return {
    user: data ?? null,
    isLoading,
    isError: !!error,
    error: error as Error | null,
    mutate,
  };
}

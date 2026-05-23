'use client';

import useSWR from 'swr';

interface ExpenseSplit {
  userId: string;
  share: number;
  splitType: 'equal' | 'exact' | 'percentage';
  userName?: string;
}

interface Expense {
  _id: string;
  groupId: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  paidByName?: string;
  date: string;
  splits: ExpenseSplit[];
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = async (url: string): Promise<Expense[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load expenses' }));
    throw new Error(err.error || 'Failed to load expenses');
  }
  const json = await res.json();
  return json.data;
};

export function useExpenses(groupId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Expense[]>(
    groupId ? `/api/groups/${groupId}/expenses` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    expenses: data ?? [],
    isLoading,
    error: error as Error | null,
    mutate,
  };
}

export type { Expense, ExpenseSplit };

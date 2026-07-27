'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroup } from '@/hooks/useGroup';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import TopBar from '@/components/layout/TopBar';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import Skeleton from '@/components/ui/Skeleton';

type ExpenseFormMember = {
  userId: {
    _id: string;
    name: string;
    email: string;
    upiId?: string;
    avatarUrl?: string;
  };
  role: 'admin' | 'member';
  joinedAt: string | Date;
};

export default function AddExpensePage() {
  const { id: groupId } = useParams() as { id: string };
  const router = useRouter();
  const toast = useToast();

  const { group, isLoading: loadingGroup, error: groupError } = useGroup(groupId);
  const { mutate: mutateExpenses } = useExpenses(groupId);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const expenseFormMembers: ExpenseFormMember[] = (group?.members || []).map((member) => {
    if (typeof member.userId === 'string') {
      return {
        userId: {
          _id: member.userId,
          name: member.name || 'Member',
          email: member.email || '',
          upiId: member.upiId,
          avatarUrl: member.avatarUrl,
        },
        role: member.role,
        joinedAt: member.joinedAt,
      };
    }

    return {
      userId: {
        _id: member.userId._id,
        name: member.userId.name || member.name || 'Member',
        email: member.userId.email || member.email || '',
        upiId: member.userId.upiId || member.upiId,
        avatarUrl: member.userId.avatarUrl || member.avatarUrl,
      },
      role: member.role,
      joinedAt: member.joinedAt,
    };
  });

  const handleSubmit = async (data: {
    description: string;
    amount: number;
    category: string;
    paidBy: string;
    date?: string;
    splits: { userId: string; share: number; splitType: string }[];
  }) => {
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to add expense');
      }

      toast.success('Expense added successfully!');
      
      // Mutate cache and redirect
      await mutateExpenses();
      router.replace(`/groups/${groupId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      throw err;
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-16">
      {/* Top bar with back option */}
      <TopBar title="Add Expense" showBack />

      {/* Header title */}
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-ink-muted">
          New Transaction
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-ink leading-tight">
          Record Shared Bill
        </h2>
      </div>

      {error && (
        <div className="border-2 border-danger bg-danger-soft text-danger p-3 rounded-lg font-bold font-['Space_Grotesk'] text-sm">
          {error}
        </div>
      )}

      {loadingGroup ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="w-full h-32 rounded-2xl border-2 border-ink" />
          <Skeleton className="w-full h-12 rounded-lg border-2 border-ink" />
          <Skeleton className="w-full h-48 rounded-2xl border-2 border-ink" />
        </div>
      ) : groupError || !group ? (
        <div className="border-2 border-danger bg-danger-soft text-danger p-4 rounded-xl font-bold font-['Space_Grotesk'] text-sm text-center">
          Failed to load group members. Please go back.
        </div>
      ) : (
        <ExpenseForm
          groupId={groupId}
          members={expenseFormMembers}
          currentUserId={user?._id}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

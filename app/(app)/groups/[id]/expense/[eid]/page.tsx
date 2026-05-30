'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import TopBar from '@/components/layout/TopBar';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import Skeleton from '@/components/ui/Skeleton';
import { useGroup } from '@/hooks/useGroup';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

interface ExpenseData {
  _id: string;
  description: string;
  amount: number;
  category: string;
  paidBy: { _id: string; name: string; email: string; upiId?: string; avatarUrl?: string };
  date: string;
  splits: { userId: string; share: number; splitType: 'equal' | 'exact' | 'percentage' }[];
  createdBy: string;
}

type ExpenseFormMember = {
  userId: { _id: string; name: string; email: string; upiId?: string; avatarUrl?: string };
  role: 'admin' | 'member';
  joinedAt: string | Date;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch expense');
  const json = await res.json();
  return json.data as ExpenseData;
};

export default function ExpenseDetailPage() {
  const { id: groupId, eid: expenseId } = useParams() as { id: string; eid: string };
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { group, isLoading: loadingGroup } = useGroup(groupId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: expense, isLoading: loadingExpense, error } = useSWR<ExpenseData>(
    expenseId && groupId ? `/api/groups/${groupId}/expenses/${expenseId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const isLoading = loadingGroup || loadingExpense;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pt-16" style={{ background: 'var(--t-surface)' }}>
        <TopBar showBack title="Expense Detail" />
        <Skeleton className="w-full h-32 rounded-2xl" />
        <Skeleton className="w-full h-12 rounded-lg" />
        <Skeleton className="w-full h-48 rounded-2xl" />
      </div>
    );
  }

  if (error || !expense || !group) {
    return (
      <div className="flex flex-col gap-6 pt-16" style={{ background: 'var(--t-surface)' }}>
        <TopBar showBack title="Expense Detail" />
        <div className="p-4 rounded-xl font-bold font-['Space_Grotesk'] text-sm text-center" style={{ border: '2px solid var(--t-danger)', background: 'var(--t-danger-bg)', color: 'var(--t-danger)' }}>
          Expense not found or you are not a member of this group.
        </div>
      </div>
    );
  }

  const myMemberId = user?._id.toString();
  const isCreator = expense.createdBy === myMemberId;
  const myMember = group.members?.find((m: { userId: { _id: string } | string; role: string }) => {
    const uid = typeof m.userId === 'string' ? m.userId : m.userId?._id;
    return uid?.toString() === myMemberId;
  });
  const isAdmin = myMember?.role === 'admin';
  const canEdit = isAdmin || isCreator;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expenseFormMembers: ExpenseFormMember[] = (group.members || []).map((member: any) => {
    if (typeof member.userId === 'string') {
      return {
        userId: { _id: member.userId, name: member.name || 'Member', email: member.email || '', upiId: member.upiId, avatarUrl: member.avatarUrl },
        role: member.role as 'admin' | 'member',
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
      role: member.role as 'admin' | 'member',
      joinedAt: member.joinedAt,
    };
  });

  const handleSubmit = async (data: {
    description: string;
    amount: number;
    category: string;
    paidBy: string;
    date?: string;
    splits: { userId: string; share: number; splitType: 'equal' | 'exact' | 'percentage' }[];
  }) => {
    const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update expense');
    toast.success('Expense updated!');
    router.replace(`/groups/${groupId}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete expense');
      toast.success('Expense deleted');
      router.replace(`/groups/${groupId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const initialData = {
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    paidBy: expense.paidBy._id,
    date: expense.date,
    splits: expense.splits,
  };

  return (
    <div className="flex flex-col gap-6 pt-16 pb-8" style={{ background: 'var(--t-surface)' }}>
      <TopBar
        title="Edit Expense"
        showBack
        rightAction={
          canEdit ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-sm font-['Space_Grotesk'] cursor-pointer"
              style={{ background: 'var(--t-danger-bg)', color: 'var(--t-danger)', border: '1px solid var(--t-danger)' }}
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Delete
            </button>
          ) : null
        }
      />

      {/* Expense details card */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>
          {canEdit ? 'Edit Transaction' : 'Expense Details'}
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] leading-tight" style={{ color: 'var(--t-on-surface)' }}>
          {expense.description}
        </h2>
      </div>

      {!canEdit && (
        <div className="p-3 rounded-xl text-sm font-semibold font-['DM_Sans']" style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-surface-3)', color: 'var(--t-on-surface-muted)' }}>
          ℹ️ You can view this expense but only the creator or group admin can edit it.
        </div>
      )}

      {canEdit ? (
        <ExpenseForm
          groupId={groupId}
          members={expenseFormMembers}
          currentUserId={myMemberId}
          initialData={initialData}
          onSubmit={handleSubmit}
        />
      ) : (
        /* Read-only view */
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl flex flex-col gap-3" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}>
            <div className="flex justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--t-on-surface-muted)' }}>Amount</span>
              <span className="font-bold font-['Syne'] text-xl" style={{ color: 'var(--t-primary)' }}>₹{expense.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--t-on-surface-muted)' }}>Paid By</span>
              <span className="font-bold text-sm" style={{ color: 'var(--t-on-surface)' }}>{expense.paidBy.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--t-on-surface-muted)' }}>Category</span>
              <span className="font-bold text-sm capitalize" style={{ color: 'var(--t-on-surface)' }}>{expense.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--t-on-surface-muted)' }}>Date</span>
              <span className="font-bold text-sm" style={{ color: 'var(--t-on-surface)' }}>{new Date(expense.date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}>
            <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>Splits</span>
            {expense.splits.map((split, i) => {
              const member = expenseFormMembers.find(m => m.userId._id === split.userId);
              return (
                <div key={i} className="flex justify-between py-1.5" style={{ borderBottom: i < expense.splits.length - 1 ? '1px solid var(--t-surface-3)' : 'none' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--t-on-surface)' }}>{member?.userId.name || split.userId}</span>
                  <span className="font-bold font-['Syne'] text-sm" style={{ color: split.share > 0 ? 'var(--t-danger)' : 'var(--t-on-surface-muted)' }}>₹{split.share.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[360px] rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '4px 4px 0px 0px var(--t-shadow)' }}>
            <h3 className="font-bold font-['Space_Grotesk'] text-lg" style={{ color: 'var(--t-on-surface)' }}>Delete Expense?</h3>
            <p className="text-sm" style={{ color: 'var(--t-on-surface-muted)' }}>
              This will permanently delete &quot;{expense.description}&quot;. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer"
                style={{ background: 'var(--t-surface-3)', color: 'var(--t-on-surface)', border: '2px solid var(--t-border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--t-danger)', color: '#fff', border: '2px solid var(--t-border)' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

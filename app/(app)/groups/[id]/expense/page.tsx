'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import TopBar from '@/components/layout/TopBar';
import ExpenseItem from '@/components/expenses/ExpenseItem';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  paidBy: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  date: string;
  splits: Array<{
    userId: string;
    share: number;
    splitType: 'equal' | 'exact' | 'percentage';
  }>;
  createdBy: string;
}

const expensesFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
};

export default function GroupExpensesPage() {
  const { id: groupId } = useParams() as { id: string };
  const toast = useToast();
  const { user } = useAuth();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaidBy, setFilterPaidBy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const { data: response, isLoading, error, mutate } = useSWR<{ data: Expense[] }>(
    groupId ? `/api/groups/${groupId}/expenses` : null,
    expensesFetcher,
    { revalidateOnFocus: true }
  );

  const expenses = response?.data || [];

  // Get unique payers for filter
  const payers = Array.from(
    new Map(expenses.map(e => [e.paidBy._id, e.paidBy])).values()
  );

  // Get unique categories
  const categories = Array.from(new Set(expenses.map(e => e.category)));

  // Filter expenses
  const filtered = expenses.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterPaidBy !== 'all' && e.paidBy._id !== filterPaidBy) return false;
    return true;
  });

  // Sort expenses
  if (sortBy === 'date') {
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else {
    filtered.sort((a, b) => b.amount - a.amount);
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete expense');
      
      toast.success('Expense deleted');
      mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete expense';
      toast.error(message);
    }
  };

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-4 pt-16 pb-24">
      <TopBar
        title="Expenses"
        rightAction={
          <Link href={`/groups/${groupId}/expense/new`}>
            <Button size="sm" className="h-10">
              <span className="material-symbols-outlined text-xl">add</span>
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="px-4 space-y-3">
        {/* Sort */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
              sortBy === 'date'
                ? 'bg-[#FF4D00] text-white border-[#FF4D00]'
                : 'bg-card text-ink border-soft'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('amount')}
            className={`px-3 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
              sortBy === 'amount'
                ? 'bg-[#FF4D00] text-white border-[#FF4D00]'
                : 'bg-card text-ink border-soft'
            }`}
          >
            Highest
          </button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2 ${
                filterCategory === 'all'
                  ? 'bg-[#FF4D00] text-white border-[#FF4D00]'
                  : 'bg-card text-ink border-soft'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2 ${
                  filterCategory === cat
                    ? 'bg-[#FF4D00] text-white border-[#FF4D00]'
                    : 'bg-card text-ink border-soft'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Payer Filter */}
        {payers.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterPaidBy('all')}
              className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2 ${
                filterPaidBy === 'all'
                  ? 'bg-[#FF4D00] text-white border-[#FF4D00]'
                  : 'bg-card text-ink border-soft'
              }`}
            >
              All Members
            </button>
            {payers.map(payer => (
              <button
                key={payer._id}
                onClick={() => setFilterPaidBy(payer._id)}
                className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2 ${
                  filterPaidBy === payer._id
                    ? 'bg-[#FF4D00] text-white border-[#FF4D00]'
                    : 'bg-card text-ink border-soft'
                }`}
              >
                {payer.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Total Summary */}
      {filtered.length > 0 && (
        <div className="px-4">
          <Card className="bg-[#FFE8DF] border-[#FF4D00]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF4D00]">
                Total Expenses ({filtered.length})
              </span>
              <span className="text-xl font-bold font-['Syne'] text-[#FF4D00]">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Content */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))
        ) : error ? (
          <Card className="text-center py-8">
            <p className="text-ink-muted text-sm">Failed to load expenses</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-5xl mb-2">📭</p>
            <p className="text-ink-muted font-semibold mb-4">
              {expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}
            </p>
            {expenses.length === 0 && (
              <Link href={`/groups/${groupId}/expense/new`}>
                <Button size="sm">Add First Expense</Button>
              </Link>
            )}
          </Card>
        ) : (
          filtered.map(expense => (
            <ExpenseItem
              key={expense._id}
              expense={expense}
              onDelete={() => handleDeleteExpense(expense._id)}
              isEditable={expense.createdBy === user?._id}
              isDeletable={expense.createdBy === user?._id}
            />
          ))
        )}
      </div>
    </div>
  );
}

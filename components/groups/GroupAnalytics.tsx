'use client';

import React from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import Skeleton from '@/components/ui/Skeleton';

interface GroupAnalyticsProps {
  groupId: string;
}

export default function GroupAnalytics({ groupId }: GroupAnalyticsProps) {
  const { expenses, isLoading, error } = useExpenses(groupId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="w-full h-16 rounded-xl" />
        <Skeleton className="w-full h-16 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl font-bold font-['Space_Grotesk'] text-xs text-center" style={{ border: '2px solid var(--t-danger)', background: 'var(--t-danger-bg)', color: 'var(--t-danger)' }}>
        Failed to load analytics.
      </div>
    );
  }

  // Aggregate expenses by day
  const expensesByDay = expenses.reduce((acc: Record<string, number>, expense) => {
    const dateStr = expense.date || expense.createdAt;
    if (!dateStr) return acc;

    // Attempt to handle date conversion properly
    const dateObj = new Date(dateStr);

    // Check if valid date
    if (isNaN(dateObj.getTime())) return acc;

    const date = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += expense.amount;

    return acc;
  }, {});

  // Sort dates descending
  const sortedDays = Object.keys(expensesByDay).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (sortedDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl text-center" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)', color: 'var(--t-on-surface-muted)' }}>
        <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">analytics</span>
        <h3 className="font-bold font-['Space_Grotesk'] text-lg mb-1" style={{ color: 'var(--t-on-surface)' }}>No Activity Yet</h3>
        <p className="text-sm">Add some expenses to see daily analytics.</p>
      </div>
    );
  }

  const maxAmount = Math.max(...Object.values(expensesByDay));

  return (
    <div className="flex flex-col gap-4">
      {sortedDays.map((date) => {
        const amount = expensesByDay[date];
        const percentage = Math.max(5, (amount / maxAmount) * 100);

        return (
          <div key={date} className="flex flex-col gap-2 p-4 rounded-xl" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm font-['DM_Sans']" style={{ color: 'var(--t-on-surface)' }}>{date}</span>
              <span className="font-bold text-sm font-['Space_Grotesk']" style={{ color: 'var(--t-primary)' }}>₹{amount.toFixed(2)}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--t-surface-3)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, background: 'var(--t-primary)' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

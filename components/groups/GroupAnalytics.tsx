'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import Skeleton from '@/components/ui/Skeleton';
import ExpenseItem from '@/components/expenses/ExpenseItem';


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

  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Compute KPIs
  const totalSpend = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalTransactions = expenses.length;

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
  const activeDaysCount = sortedDays.length;
  const avgPerDay = activeDaysCount > 0 ? totalSpend / activeDaysCount : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="flex flex-col p-4 rounded-xl" style={{ background: 'var(--t-primary-container)', border: '2px solid var(--t-primary)', boxShadow: '2px 2px 0px 0px var(--t-primary)' }}>
          <span className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--t-on-surface-muted)' }}>Total Spend</span>
          <span className="text-xl font-bold font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface)' }}>₹{totalSpend.toFixed(2)}</span>
        </div>
        <div className="flex flex-col p-4 rounded-xl" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}>
          <span className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--t-on-surface-muted)' }}>Avg / Active Day</span>
          <span className="text-xl font-bold font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface)' }}>₹{avgPerDay.toFixed(2)}</span>
        </div>
        <div className="col-span-2 flex justify-between items-center p-4 rounded-xl" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}>
          <span className="text-sm font-bold uppercase" style={{ color: 'var(--t-on-surface-muted)' }}>Total Transactions</span>
          <span className="text-lg font-bold font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface)' }}>{totalTransactions}</span>
        </div>
      </div>

      <h3 className="font-bold font-['Space_Grotesk'] text-lg mt-2 mb-1" style={{ color: 'var(--t-on-surface)' }}>Daily Breakdown</h3>

      {sortedDays.map((date) => {
        const amount = expensesByDay[date];
        const percentage = Math.max(5, (amount / maxAmount) * 100);
        const isExpanded = expandedDate === date;

        return (
          <div
            key={date}
            className="flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-all"
            style={{
              background: isExpanded ? 'var(--t-surface-2)' : 'var(--t-card-bg)',
              border: '2px solid var(--t-border)',
              boxShadow: '2px 2px 0px 0px var(--t-shadow)'
            }}
            onClick={() => setExpandedDate(isExpanded ? null : date)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm font-['DM_Sans']" style={{ color: 'var(--t-on-surface)' }}>{date}</span>
                <span className="material-symbols-outlined text-[18px] transition-transform" style={{ color: 'var(--t-on-surface-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                  expand_more
                </span>
              </div>
              <span className="font-bold text-sm font-['Space_Grotesk']" style={{ color: 'var(--t-primary)' }}>₹{amount.toFixed(2)}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--t-surface-3)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, background: 'var(--t-primary)' }}
              />
            </div>
            {isExpanded && (
              <div className="flex flex-col gap-4 mt-3 pt-3" style={{ borderTop: '2px solid var(--t-border)' }}>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase" style={{ color: 'var(--t-on-surface-muted)' }}>Categorical Distribution</span>
                  <div className="flex flex-col gap-1">
                    {(() => {
                      const dayExpenses = expenses.filter(e => {
                        const dStr = e.date || e.createdAt;
                        if (!dStr) return false;
                        const dObj = new Date(dStr);
                        if (isNaN(dObj.getTime())) return false;
                        return dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) === date;
                      });

                      const categoryTotals = dayExpenses.reduce((acc: Record<string, number>, exp) => {
                        const cat = exp.category || 'other';
                        acc[cat] = (acc[cat] || 0) + exp.amount;
                        return acc;
                      }, {});

                      return Object.entries(categoryTotals)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, total]) => (
                        <div key={cat} className="flex justify-between items-center text-sm font-['DM_Sans']">
                          <span className="capitalize" style={{ color: 'var(--t-on-surface)' }}>{cat}</span>
                          <span className="font-bold" style={{ color: 'var(--t-on-surface)' }}>₹{total.toFixed(2)}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase" style={{ color: 'var(--t-on-surface-muted)' }}>Transactions</span>
                  <div className="flex flex-col gap-2">
                    {expenses
                      .filter(e => {
                        const dStr = e.date || e.createdAt;
                        if (!dStr) return false;
                        const dObj = new Date(dStr);
                        if (isNaN(dObj.getTime())) return false;
                        return dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) === date;
                      })
                      .map(exp => (
                        <ExpenseItem
                          key={exp._id || (exp as any).id}
                          expense={{
                            ...exp,
                            id: exp._id || (exp as any).id,
                          }}
                        />
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

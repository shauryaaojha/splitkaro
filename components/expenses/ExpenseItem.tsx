'use client';

import React from 'react';

interface ExpenseData {
  id?: string;
  _id?: string;
  description: string;
  amount: number;
  category: string;
  categoryEmoji?: string;
  paidBy:
    | string
    | {
        _id?: string;
        name?: string;
        avatarUrl?: string;
      };
  date: string;
  myShare?: number;
}

interface ExpenseItemProps {
  expense: ExpenseData;
  onDelete?: () => void;
  onEdit?: () => void;
  isEditable?: boolean;
  isDeletable?: boolean;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍔',
  trip: '✈️',
  home: '🏠',
  fun: '🎮',
  travel: '✈️',
  shopping: '🛒',
  rent: '🏠',
  cafe: '☕',
  entertainment: '🎮',
  health: '🏥',
  other: '📦',
};

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getPaidByLabel(paidBy: ExpenseData['paidBy']): string {
  if (typeof paidBy === 'string') return paidBy;
  return paidBy.name || 'Unknown';
}

export default function ExpenseItem({
  expense,
  onDelete,
  onEdit,
  isEditable = false,
  isDeletable = false,
}: ExpenseItemProps) {
  const categoryKey = expense.category.toLowerCase().split(':')[0];
  const categoryEmoji = expense.categoryEmoji || CATEGORY_EMOJIS[categoryKey] || '📦';
  const paidBy = getPaidByLabel(expense.paidBy);
  const customCategory = expense.category.startsWith('other:') ? expense.category.split('other:')[1] : null;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: 'var(--t-card-bg)',
        border: '2px solid var(--t-border)',
        boxShadow: '1px 1px 0px 0px var(--t-shadow)',
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
        style={{
          background: 'var(--t-surface-2)',
          border: '2px solid var(--t-border)',
        }}
      >
        {categoryEmoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold font-['DM_Sans'] text-sm truncate" style={{ color: 'var(--t-on-surface)' }}>
          {expense.description}
        </p>
        <p className="text-xs font-['DM_Sans'] truncate" style={{ color: 'var(--t-on-surface-muted)' }}>
          Paid by {paidBy}
          {customCategory ? ` · ${customCategory}` : ''}
          {' ·'} {formatDate(expense.date)}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold font-['Space_Grotesk'] text-sm" style={{ color: 'var(--t-on-surface)' }}>
          {formatCurrency(expense.amount)}
        </p>
        {expense.myShare !== undefined && (
          <p className="text-xs font-['DM_Sans']" style={{ color: 'var(--t-on-surface-muted)' }}>
            Your share: {formatCurrency(expense.myShare)}
          </p>
        )}
      </div>

      {(isEditable || isDeletable) && (
        <div className="flex items-center gap-1 shrink-0">
          {isEditable && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              style={{
                border: '2px solid var(--t-border)',
                background: 'var(--t-card-bg)',
                color: 'var(--t-on-surface)',
                boxShadow: '1px 1px 0px 0px var(--t-shadow)',
              }}
              aria-label="Edit expense"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          )}
          {isDeletable && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              style={{
                border: '2px solid var(--t-border)',
                background: 'var(--t-danger-bg)',
                color: 'var(--t-danger)',
                boxShadow: '1px 1px 0px 0px var(--t-shadow)',
              }}
              aria-label="Delete expense"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

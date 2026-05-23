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
  food: '🍕',
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
  const categoryKey = expense.category.toLowerCase();
  const categoryEmoji = expense.categoryEmoji || CATEGORY_EMOJIS[categoryKey] || '📦';
  const paidBy = getPaidByLabel(expense.paidBy);

  return (
    <div className="flex items-center gap-3 p-3 bg-white border-2 border-[#1c1b1b] rounded-xl shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]">
      <div className="w-10 h-10 rounded-lg border-2 border-[#1c1b1b] bg-[#fcf9f8] flex items-center justify-center text-lg shrink-0">
        {categoryEmoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium font-['DM_Sans'] text-sm text-[#1c1b1b] truncate">
          {expense.description}
        </p>
        <p className="text-xs text-[#5d5c74] font-['DM_Sans']">
          Paid by {paidBy} · {formatDate(expense.date)}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold font-['Space_Grotesk'] text-sm text-[#1c1b1b]">
          {formatCurrency(expense.amount)}
        </p>
        {expense.myShare !== undefined && (
          <p className="text-xs text-[#5d5c74] font-['DM_Sans']">
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
              className="w-8 h-8 rounded-full border-2 border-[#1c1b1b] bg-white flex items-center justify-center"
              aria-label="Edit expense"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          )}
          {isDeletable && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-8 h-8 rounded-full border-2 border-[#1c1b1b] bg-white text-[#ba1a1a] flex items-center justify-center"
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

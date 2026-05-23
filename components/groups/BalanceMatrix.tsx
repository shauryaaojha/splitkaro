'use client';

import React from 'react';
import Avatar from '@/components/ui/Avatar';

interface BalanceEntry {
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  amount: number; // positive = owed to you, negative = you owe
}

interface BalanceMatrixProps {
  balances: BalanceEntry[];
}

function formatCurrency(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
}

export default function BalanceMatrix({ balances }: BalanceMatrixProps) {
  if (balances.length === 0) {
    return (
      <div className="text-center py-6 text-[#5d5c74] font-['DM_Sans']">
        <span className="material-symbols-outlined text-[32px] mb-2 block">
          check_circle
        </span>
        No pending balances
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {balances.map((entry) => {
        const isPositive = entry.amount > 0;
        return (
          <div
            key={entry.user.id}
            className="flex items-center gap-3 p-3 bg-[#fcf9f8] border-2 border-[#1c1b1b] rounded-xl shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]"
          >
            <Avatar
              src={entry.user.avatarUrl}
              name={entry.user.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium font-['DM_Sans'] text-sm text-[#1c1b1b] truncate">
                {entry.user.name}
              </p>
              <p className="text-xs text-[#5d5c74] font-['DM_Sans']">
                {isPositive ? 'owes you' : 'you owe'}
              </p>
            </div>
            <span
              className={[
                "font-bold font-['Space_Grotesk'] text-sm",
                isPositive ? 'text-[#1A893D]' : 'text-[#ba1a1a]',
              ].join(' ')}
            >
              {isPositive ? '+' : '-'}{formatCurrency(entry.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import React from 'react';
import Avatar from '@/components/ui/Avatar';

interface TransactionParty {
  _id: string;
  name: string;
  avatarUrl?: string;
}

export interface SettlementTransaction {
  from: TransactionParty;
  to: TransactionParty;
  amount: number;
}

interface BalanceMatrixProps {
  /** Simplified debts: who pays whom, and how much */
  transactions: SettlementTransaction[];
  currentUserId?: string;
}

function formatCurrency(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Shows exactly who owes whom, rather than a single ambiguous number per
 * member. Rows involving the signed-in user are phrased from their point of
 * view ("You have to pay", "You'll get back") so the direction is unmistakable.
 */
export default function BalanceMatrix({
  transactions,
  currentUserId,
}: BalanceMatrixProps) {
  if (transactions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl text-center"
        style={{
          background: 'var(--t-card-bg)',
          border: '2px solid var(--t-border)',
          boxShadow: '2px 2px 0px 0px var(--t-shadow)',
        }}
      >
        <span
          className="material-symbols-outlined text-4xl mb-3"
          style={{ color: 'var(--t-success)' }}
        >
          check_circle
        </span>
        <span
          className="text-sm font-bold font-['Space_Grotesk']"
          style={{ color: 'var(--t-on-surface)' }}
        >
          No pending balances
        </span>
        <span className="text-xs mt-1" style={{ color: 'var(--t-on-surface-muted)' }}>
          Everyone in this group is square.
        </span>
      </div>
    );
  }

  // Net position for the signed-in user across every pending debt
  const myNet = transactions.reduce((sum, t) => {
    if (t.from._id === currentUserId) return sum - t.amount;
    if (t.to._id === currentUserId) return sum + t.amount;
    return sum;
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* My overall position */}
      {currentUserId && myNet !== 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{
            background: myNet > 0 ? 'var(--t-success-bg)' : 'var(--t-danger-bg)',
            border: '2px solid var(--t-border)',
            boxShadow: '2px 2px 0px 0px var(--t-shadow)',
          }}
        >
          <span
            className="material-symbols-outlined text-[28px]"
            style={{ color: myNet > 0 ? 'var(--t-success)' : 'var(--t-danger)' }}
          >
            {myNet > 0 ? 'savings' : 'account_balance_wallet'}
          </span>
          <div className="flex flex-col">
            <span
              className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk']"
              style={{ color: 'var(--t-on-surface-muted)' }}
            >
              {myNet > 0 ? "You'll get back" : 'You have to pay'}
            </span>
            <span
              className="text-xl font-['Syne'] font-extrabold"
              style={{ color: myNet > 0 ? 'var(--t-success)' : 'var(--t-danger)' }}
            >
              {formatCurrency(myNet)}
            </span>
          </div>
        </div>
      )}

      <span
        className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] px-1"
        style={{ color: 'var(--t-on-surface-muted)' }}
      >
        Who owes whom
      </span>

      <div className="flex flex-col gap-2">
        {transactions.map((t, idx) => {
          const iAmPayer = t.from._id === currentUserId;
          const iAmPayee = t.to._id === currentUserId;

          // The other party is the one worth showing an avatar for; for debts
          // between two other members, the payer leads the row.
          const face = iAmPayer ? t.to : t.from;

          let label: string;
          let sublabel: string;
          let color: string;

          if (iAmPayer) {
            label = t.to.name;
            sublabel = 'You have to pay';
            color = 'var(--t-danger)';
          } else if (iAmPayee) {
            label = t.from.name;
            sublabel = "You'll get back";
            color = 'var(--t-success)';
          } else {
            label = `${t.from.name} → ${t.to.name}`;
            sublabel = `${t.from.name} pays ${t.to.name}`;
            color = 'var(--t-on-surface)';
          }

          return (
            <div
              key={`${t.from._id}-${t.to._id}-${idx}`}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: 'var(--t-card-bg)',
                border: '2px solid var(--t-border)',
                boxShadow: '1px 1px 0px 0px var(--t-shadow)',
              }}
            >
              <Avatar src={face.avatarUrl} name={face.name} size="sm" />

              <div className="flex-1 min-w-0">
                <p
                  className="font-bold font-['DM_Sans'] text-sm truncate"
                  style={{ color: 'var(--t-on-surface)' }}
                >
                  {label}
                </p>
                <p
                  className="text-xs font-['DM_Sans'] truncate"
                  style={{ color: 'var(--t-on-surface-muted)' }}
                >
                  {sublabel}
                </p>
              </div>

              <span
                className="font-bold font-['Space_Grotesk'] text-sm shrink-0"
                style={{ color }}
              >
                {formatCurrency(t.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

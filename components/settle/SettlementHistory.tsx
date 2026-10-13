'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';

interface Party {
  _id: string;
  name: string;
  avatarUrl?: string;
}

interface SettlementRow {
  _id: string;
  payer: Party;
  payee: Party;
  amount: number;
  method?: 'manual' | 'upi_app';
  upiTxnId?: string;
  createdAt: string;
}

const fetcher = async (url: string): Promise<SettlementRow[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load payments');
  const json = await res.json();
  return json.data;
};

interface SettlementHistoryProps {
  groupId: string;
  myId?: string;
  /** Balances change when a settlement is removed */
  onChanged: () => void;
}

/**
 * Recent payments in the group. The payee can report one as not received and
 * the payer can undo theirs; both put the amount back on the balances.
 */
export default function SettlementHistory({ groupId, myId, onChanged }: SettlementHistoryProps) {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, mutate } = useSWR<SettlementRow[]>(`/api/groups/${groupId}/settlements`, fetcher);

  const rows = (data ?? []).filter((r) => r.payer && r.payee).slice(0, 10);
  if (rows.length === 0) return null;

  const remove = async (row: SettlementRow, asPayee: boolean) => {
    const question = asPayee
      ? `Report that you did not receive ₹${row.amount.toFixed(2)} from ${row.payer.name}? It will be owed again.`
      : `Undo your ₹${row.amount.toFixed(2)} settlement with ${row.payee.name}?`;
    if (!window.confirm(question)) return;

    setBusyId(row._id);
    try {
      const res = await fetch(`/api/settlements/${row._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update payment');
      toast.success(json.message);
      await mutate();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-2">
      <span
        className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] px-1"
        style={{ color: 'var(--t-on-surface-muted)' }}
      >
        Recent payments
      </span>
      {rows.map((row) => {
        const isPayer = row.payer._id === myId;
        const isPayee = row.payee._id === myId;
        const viaUpi = row.method === 'upi_app';
        return (
          <div
            key={row._id}
            className="flex items-center justify-between gap-3 p-4 rounded-2xl"
            style={{
              background: 'var(--t-card-bg)',
              border: '2px solid var(--t-border)',
              boxShadow: '2px 2px 0px 0px var(--t-shadow)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={row.payer.name} src={row.payer.avatarUrl} size="sm" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold font-['DM_Sans'] truncate" style={{ color: 'var(--t-on-surface)' }}>
                  {isPayer ? 'You' : row.payer.name} → {isPayee ? 'you' : row.payee.name}
                </span>
                <span className="text-[11px] font-['DM_Sans'] truncate" style={{ color: 'var(--t-on-surface-muted)' }}>
                  {new Date(row.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  {' · '}
                  {viaUpi ? `UPI${row.upiTxnId ? ` · ${row.upiTxnId}` : ''}` : 'Marked paid'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-base font-['Syne'] font-extrabold" style={{ color: 'var(--t-success)' }}>
                ₹{row.amount.toFixed(2)}
              </span>
              {(isPayee || isPayer) && (
                <button
                  type="button"
                  disabled={busyId === row._id}
                  onClick={() => remove(row, isPayee)}
                  className="rounded-full px-3 py-1 font-bold text-[10px] uppercase font-['Space_Grotesk'] cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--t-danger-bg)', color: 'var(--t-danger)', border: '1px solid var(--t-border)' }}
                >
                  {busyId === row._id ? '…' : isPayee ? 'Not received?' : 'Undo'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

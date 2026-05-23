'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useGroup } from '@/hooks/useGroup';
import { useToast } from '@/components/ui/Toast';
import TopBar from '@/components/layout/TopBar';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import UpiQRCode from '@/components/settle/UpiQRCode';
import UpiDeepLinks from '@/components/settle/UpiDeepLinks';

export default function SettleUpPage() {
  const { id: groupId } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const payerId = searchParams.get('payerId') || '';
  const payeeId = searchParams.get('payeeId') || '';
  const amountStr = searchParams.get('amount') || '0';
  const amount = parseFloat(amountStr) || 0;

  const { group, isLoading: loadingGroup } = useGroup(groupId);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Find payer and payee details from group members list
  const payer = group?.members.find((m) => m.userId === payerId);
  const payee = group?.members.find((m) => m.userId === payeeId);

  const handleMarkAsPaid = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          payeeId,
          amount,
          markedManually: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to settle debt');
      }

      toast.success('Settlement recorded successfully!');
      router.replace(`/groups/${groupId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to settle debt');
    } finally {
      setSaving(false);
    }
  };

  if (loadingGroup) {
    return (
      <div className="flex flex-col gap-6 pt-16 min-h-screen">
        <TopBar showBack />
        <Skeleton className="w-full h-40 rounded-2xl border-2 border-[#1c1b1b]" />
        <Skeleton className="w-full h-64 rounded-2xl border-2 border-[#1c1b1b]" />
      </div>
    );
  }

  if (!payer || !payee || amount <= 0) {
    return (
      <div className="flex flex-col gap-6 pt-16 min-h-screen">
        <TopBar showBack />
        <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] text-[#ba1a1a] p-4 rounded-xl font-bold font-['Space_Grotesk'] text-sm text-center">
          Invalid settlement transaction parameters.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-16 min-h-screen pb-12">
      {/* TopBar */}
      <TopBar title="Settle Up" showBack />

      <div className="flex justify-center items-center">
        <h1 className="font-['Space_Grotesk'] text-[#1c1b1b] text-xl font-bold uppercase tracking-wider">
          Settle Balance
        </h1>
      </div>

      {/* Peer Settlement Card */}
      <Card className="flex flex-col items-center gap-6 bg-white border-2 border-[#1c1b1b] p-6 relative overflow-hidden">
        {/* Avatars row */}
        <div className="flex items-center justify-between w-full max-w-[240px] relative z-10">
          <Avatar
            name={payer.name || 'Payer'}
            src={payer.avatarUrl}
            size="lg"
          />
          <div className="flex flex-col items-center justify-center">
            <div className="h-0.5 w-16 bg-[#1c1b1b]" />
            <span className="material-symbols-outlined text-[#1c1b1b] bg-white border-2 border-[#1c1b1b] rounded-full p-1 -mt-3.5 shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]">
              arrow_forward
            </span>
          </div>
          <Avatar
            name={payee.name || 'Payee'}
            src={payee.avatarUrl}
            size="lg"
          />
        </div>

        {/* Text Details */}
        <div className="text-center relative z-10">
          <p className="font-bold text-sm text-[#5d5c74] font-['Space_Grotesk'] uppercase tracking-wider mb-1">
            {payer.name} owes {payee.name}
          </p>
          <p className="text-4xl font-['Syne'] font-extrabold text-[#ba1a1a] select-all">
            ₹{amount.toFixed(2)}
          </p>
        </div>
      </Card>

      {/* Settle Actions (Direct Mobile Links or Scannable QR Code) */}
      <div className="flex flex-col gap-4">
        {showQR ? (
          <div className="flex flex-col gap-4">
            <UpiQRCode
              payeeUpiId={payee.upiId || 'payee@upi'}
              payeeName={payee.name || 'Payee'}
              amount={amount}
            />
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="text-xs font-bold font-['Space_Grotesk'] text-[#aa3000] underline text-center cursor-pointer"
            >
              Show Deep Links instead
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Launch App Deep Links */}
            <UpiDeepLinks
              payeeUpiId={payee.upiId || 'payee@upi'}
              payeeName={payee.name || 'Payee'}
              amount={amount}
            />

            {/* Switch to scan QR */}
            <div className="flex items-center gap-4 my-2 px-4">
              <div className="h-0.5 flex-1 bg-[#5d5c74]/20"></div>
              <span className="font-bold text-xs font-['Space_Grotesk'] text-[#5d5c74] uppercase tracking-wider">
                OR
              </span>
              <div className="h-0.5 flex-1 bg-[#5d5c74]/20"></div>
            </div>

            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-[#eae7e7]/30 transition-colors font-bold text-sm font-['Space_Grotesk'] text-[#1c1b1b] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]"
            >
              <span className="material-symbols-outlined text-[24px]">
                qr_code_scanner
              </span>
              Scan QR Code
            </button>
          </div>
        )}

        {/* Mark paid manually ghost button */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="md"
            onClick={handleMarkAsPaid}
            loading={saving}
            disabled={saving}
            icon="done_all"
          >
            Mark as manually paid
          </Button>
        </div>
      </div>
    </div>
  );
}

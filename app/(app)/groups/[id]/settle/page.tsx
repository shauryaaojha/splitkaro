'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useGroup } from '@/hooks/useGroup';
import { useToast } from '@/components/ui/Toast';
import TopBar from '@/components/layout/TopBar';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import UpiQRCode from '@/components/settle/UpiQRCode';

interface PopulatedMember {
  userId: string | {
    _id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    upiId?: string;
  };
  name?: string;
  email?: string;
  avatarUrl?: string;
  upiId?: string;
}

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

  const getMemberDetails = (member: PopulatedMember) => {
    if (typeof member.userId === 'string') {
      return {
        _id: member.userId,
        name: member.name || 'Member',
        email: member.email || '',
        avatarUrl: member.avatarUrl,
        upiId: member.upiId || '',
      };
    }

    return {
      _id: member.userId._id,
      name: member.userId.name || member.name || 'Member',
      email: member.userId.email || member.email || '',
      avatarUrl: member.userId.avatarUrl || member.avatarUrl,
      upiId: member.userId.upiId || member.upiId || '',
    };
  };

  const members = (group?.members || []) as PopulatedMember[];
  const payer = members.map(getMemberDetails).find((m) => m._id === payerId);
  const payee = members.map(getMemberDetails).find((m) => m._id === payeeId);

  const handleMarkAsPaid = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          payerId,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to settle debt';
      toast.error(message);
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

      {/* Settle Actions — scan to pay, or record a payment made elsewhere */}
      <div className="flex flex-col gap-4">
        <UpiQRCode
          payeeUpiId={payee.upiId || 'payee@upi'}
          payeeName={payee.name || 'Payee'}
          amount={amount}
        />

        <p className="text-xs font-['DM_Sans'] text-[#5d5c74] text-center px-6">
          Open any UPI app on your phone and scan this code to pay {payee.name}.
        </p>

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

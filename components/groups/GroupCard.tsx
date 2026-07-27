'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import MemberAvatarStack from '@/components/groups/MemberAvatarStack';

interface GroupMember {
  name: string;
  avatarUrl?: string;
}

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    category: string;
    emoji: string;
    members: GroupMember[];
    balance: number; // positive = owed to you, negative = you owe, 0 = settled
  };
}

function formatCurrency(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
}

export default function GroupCard({ group }: GroupCardProps) {
  const router = useRouter();

  const balanceColor =
    group.balance > 0
      ? 'var(--t-success)'
      : group.balance < 0
        ? 'var(--t-danger)'
        : 'var(--t-on-surface-muted)';

  const balanceText =
    group.balance > 0
      ? `You'll get back ${formatCurrency(group.balance)}`
      : group.balance < 0
        ? `You have to pay ${formatCurrency(group.balance)}`
        : 'All settled up';

  return (
    <Card
      pressable
      onClick={() => router.push(`/groups/${group.id}`)}
      className="flex flex-col gap-3"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl border-2 flex items-center justify-center text-xl"
            style={{
              background: 'var(--t-surface)',
              borderColor: 'var(--t-border)',
              boxShadow: '1px 1px 0px 0px var(--t-shadow)',
            }}
          >
            {group.emoji}
          </div>
          <div>
            <h3
              className="font-bold font-['Space_Grotesk'] text-base leading-tight"
              style={{ color: 'var(--t-on-surface)' }}
            >
              {group.name}
            </h3>
            <Badge variant="neutral" className="mt-1">
              {group.category}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div
        className="flex items-center justify-between pt-1 border-t"
        style={{ borderColor: 'var(--t-surface-3)' }}
      >
        <MemberAvatarStack members={group.members} max={3} />
        <span
          className="text-sm font-bold font-['Space_Grotesk']"
          style={{ color: balanceColor }}
        >
          {balanceText}
        </span>
      </div>
    </Card>
  );
}

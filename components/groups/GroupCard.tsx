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
      ? 'text-[#1A893D]'
      : group.balance < 0
        ? 'text-[#ba1a1a]'
        : 'text-[#5d5c74]';

  const balanceText =
    group.balance > 0
      ? `You're owed ${formatCurrency(group.balance)}`
      : group.balance < 0
        ? `You owe ${formatCurrency(group.balance)}`
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
          <div className="w-11 h-11 rounded-xl border-2 border-[#1c1b1b] bg-[#fcf9f8] flex items-center justify-center text-xl shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]">
            {group.emoji}
          </div>
          <div>
            <h3 className="font-bold font-['Space_Grotesk'] text-[#1c1b1b] text-base leading-tight">
              {group.name}
            </h3>
            <Badge variant="neutral" className="mt-1">
              {group.category}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-1 border-t border-[#eae7e7]">
        <MemberAvatarStack members={group.members} max={3} />
        <span className={`text-sm font-bold font-['Space_Grotesk'] ${balanceColor}`}>
          {balanceText}
        </span>
      </div>
    </Card>
  );
}

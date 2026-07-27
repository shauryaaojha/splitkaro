'use client';

import React from 'react';
import Avatar from '@/components/ui/Avatar';

interface MemberInfo {
  name: string;
  avatarUrl?: string;
}

interface MemberAvatarStackProps {
  members: MemberInfo[];
  max?: number;
}

export default function MemberAvatarStack({
  members,
  max = 3,
}: MemberAvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className="flex items-center">
      {visible.map((member, i) => (
        <div
          key={`${member.name}-${i}`}
          className={i > 0 ? '-ml-2' : ''}
          style={{ zIndex: visible.length - i }}
        >
          <Avatar
            src={member.avatarUrl}
            name={member.name}
            size="sm"
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="-ml-2 w-8 h-8 rounded-full border-2 border-ink bg-surface-3 flex items-center justify-center text-xs font-bold font-['Space_Grotesk'] text-ink"
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

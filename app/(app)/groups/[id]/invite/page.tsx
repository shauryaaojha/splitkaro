'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useGroup } from '@/hooks/useGroup';
import TopBar from '@/components/layout/TopBar';
import GroupInviteQR from '@/components/groups/GroupInviteQR';
import Skeleton from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';

export default function GroupInvitePage() {
  const { id } = useParams() as { id: string };
  const { group, isLoading, error } = useGroup(id);

  return (
    <div className="flex flex-col gap-6 pt-16">
      {/* TopBar with back navigation */}
      <TopBar title="Invite Members" showBack />

      {/* Header title */}
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
          Add Members
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] leading-tight">
          Share Invite Link
        </h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="w-full h-80 rounded-2xl border-2 border-[#1c1b1b]" />
          <Skeleton className="w-full h-40 rounded-2xl border-2 border-[#1c1b1b]" />
        </div>
      ) : error || !group ? (
        <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] text-[#ba1a1a] p-4 rounded-2xl font-bold font-['Space_Grotesk'] text-sm text-center">
          Failed to load group details. Please go back and try again.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Invitation QR Code & Link Component */}
          <GroupInviteQR
            inviteToken={group.inviteToken}
            groupName={group.name}
          />

          {/* List of current group members */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] px-1">
              Joined Members ({group.members.length})
            </span>
            <Card className="flex flex-col gap-4">
              {group.members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between pb-3 border-b border-[#eae7e7] last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={member.name || 'Member'}
                      src={member.avatarUrl}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#1c1b1b]">
                        {member.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-[#5d5c74] font-semibold">
                        {member.email || ''}
                      </span>
                    </div>
                  </div>
                  <span className={[
                    'text-[10px] font-bold uppercase tracking-wider font-["Space_Grotesk"] px-2.5 py-1 rounded-full border border-[#1c1b1b]',
                    member.role === 'admin'
                      ? 'bg-[#ffdbd0] text-[#aa3000]'
                      : 'bg-[#eae7e7] text-[#1c1b1b]',
                  ].join(' ')}>
                    {member.role}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

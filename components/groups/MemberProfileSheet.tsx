'use client';

import React from 'react';
import Avatar from '@/components/ui/Avatar';

type PopulatedMember = {
  userId: { _id: string; name: string; email: string; upiId?: string; avatarUrl?: string } | string;
  role: 'admin' | 'member';
  joinedAt: string;
  name?: string;
  email?: string;
  upiId?: string;
  avatarUrl?: string;
};

interface MemberProfileSheetProps {
  member: PopulatedMember;
  onClose: () => void;
}

export default function MemberProfileSheet({ member, onClose }: MemberProfileSheetProps) {
  const name = typeof member.userId === 'object' ? member.userId.name : member.name || 'Member';
  const email = typeof member.userId === 'object' ? member.userId.email : member.email || '';
  const upiId = typeof member.userId === 'object' ? member.userId.upiId : member.upiId || '';
  const avatarUrl = typeof member.userId === 'object' ? member.userId.avatarUrl : member.avatarUrl;
  const joinedAt = new Date(member.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const isAdmin = member.role === 'admin';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'var(--t-card-bg)',
          border: '2px solid var(--t-border)',
          boxShadow: '4px 4px 0px 0px var(--t-shadow)',
        }}
      >
        {/* Close handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--t-surface-3)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--t-surface-3)' }}>
          <h3 className="font-bold font-['Space_Grotesk'] text-base" style={{ color: 'var(--t-on-surface)' }}>Member Profile</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:opacity-70"
            style={{ color: 'var(--t-on-surface-muted)' }}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Avatar + Name */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <Avatar name={name} src={avatarUrl} size="lg" />
              {isAdmin && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--t-primary)', border: '2px solid var(--t-card-bg)' }}
                >
                  <span className="material-symbols-outlined text-[12px] text-white">star</span>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-bold font-['Space_Grotesk'] text-xl" style={{ color: 'var(--t-on-surface)' }}>{name}</h4>
              {isAdmin && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk'] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--t-primary-container)', color: 'var(--t-primary)' }}
                >
                  Group Admin
                </span>
              )}
            </div>
          </div>

          {/* Info rows */}
          <div className="flex flex-col gap-3">
            {/* Email */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-surface-3)' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--t-accent-container)' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--t-accent)' }}>mail</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>Email</span>
                <span className="text-sm font-semibold font-['DM_Sans'] truncate" style={{ color: 'var(--t-on-surface)' }}>{email}</span>
              </div>
            </div>

            {/* UPI ID */}
            {upiId && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-surface-3)' }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--t-primary-container)' }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--t-primary)' }}>qr_code</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>UPI ID</span>
                  <span className="text-sm font-semibold font-['DM_Sans'] truncate" style={{ color: 'var(--t-on-surface)' }}>{upiId}</span>
                </div>
              </div>
            )}

            {/* Joined Date */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-surface-3)' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--t-success-bg)' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--t-success)' }}>calendar_today</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>Joined Group</span>
                <span className="text-sm font-semibold font-['DM_Sans']" style={{ color: 'var(--t-on-surface)' }}>{joinedAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

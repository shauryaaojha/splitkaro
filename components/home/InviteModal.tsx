'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

interface InviteModalProps {
  onClose: () => void;
}

export default function InviteModal({ onClose }: InviteModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
  const shareText = `Hey! I'm using SplitKaro to split expenses with friends. Join me here: ${appUrl}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on SplitKaro',
          text: shareText,
          url: appUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleEmailInvite = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch('/api/invite/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send invite');
      setEmailSent(true);
      toast.success(`Invite sent to ${email}!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send invite';
      toast.error(msg);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'var(--t-card-bg)',
          border: '2px solid var(--t-border)',
          boxShadow: '4px 4px 0px 0px var(--t-shadow)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '2px solid var(--t-surface-3)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--t-primary)', color: '#fff' }}
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </div>
            <h3 className="font-bold font-['Space_Grotesk'] text-base" style={{ color: 'var(--t-on-surface)' }}>
              Invite to SplitKaro
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer"
            style={{ color: 'var(--t-on-surface-muted)' }}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Share link section */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>
              Share App Link
            </span>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: 'var(--t-surface-2)',
                border: '2px solid var(--t-surface-3)',
              }}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--t-on-surface-muted)' }}>link</span>
              <span
                className="flex-1 text-xs font-['Space_Grotesk'] font-semibold truncate"
                style={{ color: 'var(--t-on-surface-muted)' }}
              >
                {appUrl}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:scale-95 transition-transform"
                style={{
                  background: 'var(--t-primary)',
                  color: '#fff',
                  border: '2px solid var(--t-border)',
                  boxShadow: '2px 2px 0px 0px var(--t-shadow)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                Share
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:scale-95 transition-transform"
                style={{
                  background: 'var(--t-card-bg)',
                  color: 'var(--t-on-surface)',
                  border: '2px solid var(--t-border)',
                  boxShadow: '2px 2px 0px 0px var(--t-shadow)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                Copy
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--t-surface-3)' }} />
            <span className="text-xs font-bold font-['Space_Grotesk'] uppercase" style={{ color: 'var(--t-on-surface-muted)' }}>or invite by email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--t-surface-3)' }} />
          </div>

          {/* Email invite section */}
          {emailSent ? (
            <div
              className="flex flex-col items-center gap-2 py-4 rounded-xl"
              style={{ background: 'var(--t-success-bg)', border: '2px solid var(--t-success)' }}
            >
              <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--t-success)' }}>mark_email_read</span>
              <p className="text-sm font-bold font-['Space_Grotesk'] text-center" style={{ color: 'var(--t-success)' }}>
                Invite sent to {email}!
              </p>
              <button
                onClick={() => { setEmailSent(false); setEmail(''); }}
                className="text-xs font-bold underline cursor-pointer"
                style={{ color: 'var(--t-success)' }}
              >
                Send another
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className="flex items-center gap-2 px-3 rounded-xl overflow-hidden"
                style={{
                  border: '2px solid var(--t-border)',
                  background: 'var(--t-surface)',
                  boxShadow: '2px 2px 0px 0px var(--t-shadow)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--t-on-surface-muted)' }}>mail</span>
                <input
                  type="email"
                  placeholder="friend@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 py-3 bg-transparent outline-none text-sm font-['DM_Sans'] font-semibold"
                  style={{ color: 'var(--t-on-surface)' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEmailInvite(); }}
                />
              </div>
              <button
                type="button"
                onClick={handleEmailInvite}
                disabled={sendingEmail || !email.trim()}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--t-primary)',
                  color: '#fff',
                  border: '2px solid var(--t-border)',
                  boxShadow: '2px 2px 0px 0px var(--t-shadow)',
                }}
              >
                {sendingEmail ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send Email Invite
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

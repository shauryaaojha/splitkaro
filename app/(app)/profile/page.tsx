'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useTheme, THEMES } from '@/components/layout/ThemeProvider';
import TopBar from '@/components/layout/TopBar';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import OtpInput from '@/components/ui/OtpInput';

type EditView = null | 'profile' | 'email';

export default function ProfilePage() {
  const { user, mutate: mutateAuth } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { theme, isDark, setTheme, toggleDark } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editView, setEditView] = useState<EditView>(null);

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editUpi, setEditUpi] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      toast.success('Logged out successfully!');
      await mutateAuth(undefined, false);
      router.replace('/login');
    } catch {
      toast.error('Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditUpi(user?.upiId || '');
    setEditView('profile');
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, upiId: editUpi }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update profile');
      toast.success('Profile updated!');
      await mutateAuth();
      setEditView(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendOtp = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send OTP');
      toast.success(`OTP sent to ${newEmail}`);
      setOtpStep(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Invalid OTP');
      toast.success('Email changed successfully!');
      await mutateAuth();
      setEditView(null);
      setOtpStep(false);
      setNewEmail('');
      setOtp('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-16 min-h-screen pb-12" style={{ background: 'var(--t-surface)' }}>
      <TopBar
        title="Profile"
        rightAction={
          <button
            onClick={openEditProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm font-['Space_Grotesk'] cursor-pointer"
            style={{ background: 'var(--t-primary-container)', color: 'var(--t-primary)', border: '2px solid var(--t-border)' }}
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
        }
      />

      {/* Hero Header */}
      <div
        className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl relative overflow-hidden text-center"
        style={{
          background: 'var(--t-card-bg)',
          border: '2px solid var(--t-border)',
          boxShadow: '2px 2px 0px 0px var(--t-shadow)',
        }}
      >
        <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full opacity-20 blur-xl pointer-events-none" style={{ background: 'var(--t-primary)' }} />

        <div className="relative mb-3">
          <Avatar name={user?.name || 'User'} src={user?.avatarUrl} size="lg" />
          <button
            type="button"
            onClick={openEditProfile}
            className="absolute bottom-0 right-0 w-6 h-6 text-white border-2 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: 'var(--t-primary)', borderColor: 'var(--t-border)' }}
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
        </div>

        <h3 className="font-bold font-['Space_Grotesk'] text-lg leading-tight" style={{ color: 'var(--t-on-surface)' }}>
          {user?.name || 'User'}
        </h3>
        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--t-on-surface-muted)' }}>
          {user?.email || ''}
        </p>

        {user?.upiId && (
          <div
            className="inline-flex items-center gap-1 mt-3 rounded-full px-3 py-1 font-bold font-['Space_Grotesk'] text-[10px] shadow-sm uppercase tracking-wider"
            style={{ background: 'var(--t-accent-container)', color: 'var(--t-accent)', border: '2px solid var(--t-border)' }}
          >
            <span className="material-symbols-outlined text-[14px]">qr_code</span>
            {user.upiId}
          </div>
        )}
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="flex flex-col items-center justify-center p-4 rounded-2xl"
          style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk'] mb-1" style={{ color: 'var(--t-on-surface-muted)' }}>
            Ledger Groups
          </span>
          <span className="text-2xl font-['Syne'] font-extrabold" style={{ color: 'var(--t-primary)' }}>
            3
          </span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-4 rounded-2xl"
          style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk'] mb-1" style={{ color: 'var(--t-on-surface-muted)' }}>
            Active Friends
          </span>
          <span className="text-2xl font-['Syne'] font-extrabold" style={{ color: 'var(--t-success)' }}>
            {user?.friends.length ?? 0}
          </span>
        </div>
      </div>

      {/* Appearance — Dark Mode */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] px-1" style={{ color: 'var(--t-on-surface-muted)' }}>
          Appearance
        </span>
        <div
          className="flex flex-col gap-0 rounded-2xl overflow-hidden"
          style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}
        >
          {/* Dark mode toggle */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer"
            style={{ borderBottom: '1px solid var(--t-surface-3)' }}
            onClick={toggleDark}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--t-on-surface-muted)' }}>
                {isDark ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="font-bold text-sm font-['Space_Grotesk'] uppercase tracking-wide" style={{ color: 'var(--t-on-surface)' }}>
                Dark Mode
              </span>
            </div>
            <div
              className="w-12 h-6 rounded-full relative transition-all cursor-pointer"
              style={{ background: isDark ? 'var(--t-primary)' : 'var(--t-surface-3)', border: '2px solid var(--t-border)' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                style={{
                  background: '#fff',
                  left: isDark ? '26px' : '2px',
                  boxShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>

          {/* Color theme selector */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--t-on-surface-muted)' }}>palette</span>
              <span className="font-bold text-sm font-['Space_Grotesk'] uppercase tracking-wide" style={{ color: 'var(--t-on-surface)' }}>Color Theme</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: `2px solid ${isActive ? 'var(--t-border)' : 'var(--t-surface-3)'}`,
                      background: isActive ? 'var(--t-primary-container)' : 'var(--t-surface)',
                      boxShadow: isActive ? '2px 2px 0px 0px var(--t-shadow)' : 'none',
                      transform: isActive ? 'translate(-1px, -1px)' : undefined,
                    }}
                    title={t.name}
                  >
                    <div className="w-6 h-6 rounded-full border-2" style={{ background: t.primaryHex, borderColor: isActive ? 'var(--t-border)' : 'transparent' }} />
                    <span className="text-[9px] font-bold font-['Space_Grotesk'] uppercase" style={{ color: isActive ? 'var(--t-primary)' : 'var(--t-on-surface-muted)' }}>
                      {t.emoji}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] px-1" style={{ color: 'var(--t-on-surface-muted)' }}>
          Account
        </span>
        <div
          className="flex flex-col overflow-hidden rounded-2xl"
          style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}
        >
          {[
            { label: 'Edit Profile', icon: 'person', action: openEditProfile },
            { label: 'Change Email', icon: 'mail', action: () => { setEditView('email'); setOtpStep(false); setNewEmail(''); setOtp(''); } },
            { label: 'UPI Settings', icon: 'payments', value: user?.upiId || 'Not configured', action: openEditProfile },
            { label: 'Notifications', icon: 'notifications_active', value: 'Enabled' },
            { label: 'Help & Support', icon: 'help' },
          ].map((item, idx, arr) => (
            <div
              key={idx}
              onClick={item.action}
              className="flex items-center justify-between py-3 px-4 transition-colors cursor-pointer"
              style={{
                borderBottom: idx < arr.length - 1 ? '1px solid var(--t-surface-3)' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined font-semibold text-[20px]" style={{ color: 'var(--t-on-surface-muted)' }}>
                  {item.icon}
                </span>
                <span className="font-bold text-sm font-['Space_Grotesk'] uppercase tracking-wide" style={{ color: 'var(--t-on-surface)' }}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {item.value && (
                  <span className="text-xs font-semibold truncate max-w-[140px]" style={{ color: 'var(--t-on-surface-muted)' }}>
                    {item.value}
                  </span>
                )}
                <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--t-on-surface-muted)', opacity: 0.5 }}>chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout button */}
      <div className="mt-2">
        <Button
          variant="danger"
          size="lg"
          fullWidth
          loading={loggingOut}
          disabled={loggingOut}
          onClick={handleLogout}
          icon="logout"
        >
          Sign Out
        </Button>
      </div>

      {/* === EDIT PROFILE MODAL === */}
      {editView === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[420px] rounded-2xl overflow-hidden animate-slide-up" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '4px 4px 0px 0px var(--t-shadow)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '2px solid var(--t-surface-3)' }}>
              <h3 className="font-bold font-['Space_Grotesk'] text-lg" style={{ color: 'var(--t-on-surface)' }}>Edit Profile</h3>
              <button onClick={() => setEditView(null)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ color: 'var(--t-on-surface-muted)' }}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="px-4 py-3 rounded-xl font-['DM_Sans'] font-semibold text-sm outline-none"
                  style={{ background: 'var(--t-surface)', border: '2px solid var(--t-border)', color: 'var(--t-on-surface)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>UPI ID</label>
                <input
                  type="text"
                  value={editUpi}
                  onChange={(e) => setEditUpi(e.target.value)}
                  placeholder="yourname@upi"
                  className="px-4 py-3 rounded-xl font-['DM_Sans'] font-semibold text-sm outline-none"
                  style={{ background: 'var(--t-surface)', border: '2px solid var(--t-border)', color: 'var(--t-on-surface)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setEditView(null)} className="flex-1 py-3 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer" style={{ background: 'var(--t-surface-3)', color: 'var(--t-on-surface)', border: '2px solid var(--t-border)' }}>
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !editName.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--t-primary)', color: '#fff', border: '2px solid var(--t-border)' }}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === CHANGE EMAIL MODAL === */}
      {editView === 'email' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[420px] rounded-2xl overflow-hidden animate-slide-up" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '4px 4px 0px 0px var(--t-shadow)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '2px solid var(--t-surface-3)' }}>
              <div>
                <h3 className="font-bold font-['Space_Grotesk'] text-lg" style={{ color: 'var(--t-on-surface)' }}>Change Email</h3>
                <p className="text-xs" style={{ color: 'var(--t-on-surface-muted)' }}>Current: {user?.email}</p>
              </div>
              <button onClick={() => { setEditView(null); setOtpStep(false); }} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ color: 'var(--t-on-surface-muted)' }}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {!otpStep ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>New Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new@email.com"
                      className="px-4 py-3 rounded-xl font-['DM_Sans'] font-semibold text-sm outline-none"
                      style={{ background: 'var(--t-surface)', border: '2px solid var(--t-border)', color: 'var(--t-on-surface)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}
                    />
                    <p className="text-xs" style={{ color: 'var(--t-on-surface-muted)' }}>
                      We&apos;ll send a verification code to this address.
                    </p>
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !newEmail.trim()}
                    className="w-full py-3 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'var(--t-primary)', color: '#fff', border: '2px solid var(--t-border)' }}
                  >
                    {sendingOtp ? (
                      <><span className="material-symbols-outlined text-[18px]">progress_activity</span>Sending OTP...</>
                    ) : (
                      <><span className="material-symbols-outlined text-[18px]">send</span>Send OTP</>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--t-success-bg)', color: 'var(--t-success)', border: '1px solid var(--t-success)' }}>
                    ✅ OTP sent to {newEmail}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface-muted)' }}>Enter 6-Digit OTP</label>
                    <OtpInput length={6} value={otp} onChange={setOtp} />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otp.length !== 6}
                    className="w-full py-3 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'var(--t-primary)', color: '#fff', border: '2px solid var(--t-border)' }}
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify & Change Email'}
                  </button>
                  <button
                    onClick={() => setOtpStep(false)}
                    className="text-xs font-bold text-center cursor-pointer hover:underline"
                    style={{ color: 'var(--t-on-surface-muted)' }}
                  >
                    ← Back to enter email
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

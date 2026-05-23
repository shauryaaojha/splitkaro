'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import TopBar from '@/components/layout/TopBar';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ProfilePage() {
  const { user, mutate: mutateAuth } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Logout failed');
      }

      toast.success('Logged out successfully!');
      
      // Clear SWR cache and redirect
      await mutateAuth(undefined, false);
      router.replace('/login');
    } catch {
      toast.error('Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const menuItems = [
    { label: 'UPI Settings', icon: 'payments', value: user?.upiId || 'Not configured' },
    { label: 'My Account', icon: 'person', value: user?.email || '' },
    { label: 'Notifications', icon: 'notifications_active', value: 'Enabled' },
    { label: 'System Theme', icon: 'dark_mode', value: 'Light Mode' },
    { label: 'Help & Support', icon: 'help', value: '' },
  ];

  return (
    <div className="flex flex-col gap-6 pt-16 min-h-screen pb-12">
      {/* Top Bar */}
      <TopBar title="Profile" />

      {/* Hero Header */}
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden text-center mt-2">
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#ffdbd0]/50 rounded-full opacity-40 blur-xl"></div>
        
        {/* Large Profile Picture */}
        <div className="relative mb-3">
          <Avatar
            name={user?.name || 'User'}
            src={user?.avatarUrl}
            size="lg"
          />
          <button
            type="button"
            className="absolute bottom-0 right-0 w-6 h-6 bg-[#aa3000] text-white border-2 border-[#1c1b1b] rounded-full flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] hover:bg-[#c45a2d]"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
        </div>

        <h3 className="font-bold font-['Space_Grotesk'] text-[#1c1b1b] text-lg leading-tight">
          {user?.name || 'User'}
        </h3>
        <p className="text-xs text-[#5d5c74] font-semibold mt-0.5">
          {user?.email || ''}
        </p>

        {/* UPI Tag */}
        {user?.upiId && (
          <div className="inline-flex items-center gap-1 mt-3 bg-[#e3e1f9] text-[#5d5c74] border-2 border-[#1c1b1b] rounded-full px-3 py-1 font-bold font-['Space_Grotesk'] text-[10px] shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">qr_code</span>
            {user.upiId}
          </div>
        )}
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center p-4 bg-white border-2 border-[#1c1b1b]">
          <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5d5c74] mb-1">
            Ledger Groups
          </span>
          <span className="text-2xl font-['Syne'] font-extrabold text-[#aa3000]">
            3
          </span>
        </Card>
        <Card className="flex flex-col items-center justify-center p-4 bg-white border-2 border-[#1c1b1b]">
          <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5d5c74] mb-1">
            Active Friends
          </span>
          <span className="text-2xl font-['Syne'] font-extrabold text-[#1b6d30]">
            {user?.friends.length ?? 0}
          </span>
        </Card>
      </div>

      {/* Menu Options */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] px-1">
          Preferences
        </span>

        <Card className="flex flex-col p-2 bg-white border-2 border-[#1c1b1b] divide-y divide-[#eae7e7]">
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-3 px-2 hover:bg-[#eae7e7]/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#5d5c74] font-semibold text-[20px]">
                  {item.icon}
                </span>
                <span className="font-bold text-sm text-[#1c1b1b] font-['Space_Grotesk'] uppercase tracking-wide">
                  {item.label}
                </span>
              </div>
              <span className="text-xs text-[#5d5c74] font-semibold truncate max-w-[160px]">
                {item.value}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* Logout button */}
      <div className="mt-4">
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
    </div>
  );
}

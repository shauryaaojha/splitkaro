'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/layout/BottomNav';
import InstallBanner from '@/components/layout/InstallBanner';
import PushNotificationManager from '@/components/layout/PushNotificationManager';
import Skeleton from '@/components/ui/Skeleton';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.replace('/login');
    }
  }, [user, isLoading, isError, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 max-w-[600px] mx-auto gap-4" style={{ background: 'var(--t-surface)' }}>
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="w-48 h-6 rounded" />
        <Skeleton className="w-32 h-4 rounded" />
      </div>
    );
  }

  if (isError || !user) {
    return null; // Will redirect shortly in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col max-w-[600px] mx-auto relative pb-24" style={{ background: 'var(--t-surface)', color: 'var(--t-on-surface)' }}>
      {/* Content wrapper with margin matching bottom navigation bar */}
      <main className="flex-1 px-4 py-6 w-full max-w-[600px] mx-auto overflow-y-auto">
        {children}
      </main>

      {/* Persistent Navigation */}
      <BottomNav />
      <InstallBanner />
      <PushNotificationManager />
    </div>
  );
}

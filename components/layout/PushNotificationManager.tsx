'use client';

import React, { useEffect, useState } from 'react';

export default function PushNotificationManager() {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;

    // Check if push notifications are supported
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      Promise.resolve().then(() => {
        if (active) setPermissionState('unsupported');
      });
      return;
    }

    const currentPermission = Notification.permission;
    Promise.resolve().then(() => {
      if (active) setPermissionState(currentPermission);
    });

    // Show banner only if not yet granted and user hasn't dismissed it before
    const wasDismissed = localStorage.getItem('push_banner_dismissed') === 'true';
    let timer: NodeJS.Timeout;
    if (currentPermission === 'default' && !wasDismissed) {
      // Delay showing the banner by 3s to not immediately spam user
      timer = setTimeout(() => {
        if (active) setShowBanner(true);
      }, 3000);
    }

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleRequestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      setShowBanner(false);

      if (permission === 'granted') {
        await subscribeToWebPush();
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('push_banner_dismissed', 'true');
  };

  const subscribeToWebPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await sendSubscriptionToServer(existing);
        return;
      }

      // VAPID public key from env
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn('VAPID public key not configured, skipping push subscription');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });

      await sendSubscriptionToServer(subscription);
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch {
      // Silent fail - app still works without push
    }
  };

  if (!showBanner || permissionState !== 'default' || dismissed) {
    return null;
  }

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-40 max-w-[560px] mx-auto animate-slide-up"
    >
      <div
        className="flex items-start gap-3 p-4 rounded-2xl"
        style={{
          background: 'var(--t-card-bg)',
          border: '2px solid var(--t-border)',
          boxShadow: '4px 4px 0px 0px var(--t-shadow)',
        }}
      >
        {/* Bell icon with pulse */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 animate-pulse-ring"
          style={{ background: 'var(--t-primary)', border: '2px solid var(--t-border)' }}
        >
          <span className="material-symbols-outlined text-[20px] text-white">notifications_active</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface)' }}>
            Stay Updated 🔔
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--t-on-surface-muted)' }}>
            Get notified when friends add expenses or settle up.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-full font-bold text-xs font-['Space_Grotesk'] cursor-pointer"
              style={{
                background: 'var(--t-primary)',
                color: '#fff',
                border: '2px solid var(--t-border)',
                boxShadow: '2px 2px 0px 0px var(--t-shadow)',
              }}
            >
              Enable Notifications
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-full font-bold text-xs font-['Space_Grotesk'] cursor-pointer"
              style={{
                background: 'var(--t-surface-3)',
                color: 'var(--t-on-surface-muted)',
                border: '1px solid var(--t-surface-3)',
              }}
            >
              Not now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full cursor-pointer"
          style={{ color: 'var(--t-on-surface-muted)' }}
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

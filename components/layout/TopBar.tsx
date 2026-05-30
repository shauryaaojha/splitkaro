'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  rightAction?: React.ReactNode;
}

export default function TopBar({
  title,
  showBack = false,
  showNotifications = false,
  rightAction,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40"
      style={{
        background: 'var(--t-surface)',
        borderBottom: '2px solid var(--t-border)',
        boxShadow: '2px 2px 0px 0px var(--t-shadow)',
      }}
    >
      <div className="max-w-[600px] mx-auto h-16 flex items-center px-4 gap-3">
        {/* Left section */}
        {showBack && (
          <button
            onClick={() => router.back()}
            className={[
              'w-10 h-10 flex items-center justify-center rounded-full',
              'active:translate-x-[1px] active:translate-y-[1px]',
              'transition-all duration-100 cursor-pointer',
            ].join(' ')}
            style={{
              border: '2px solid var(--t-border)',
              background: 'var(--t-card-bg)',
              boxShadow: '2px 2px 0px 0px var(--t-shadow)',
            }}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--t-on-surface)' }}>arrow_back</span>
          </button>
        )}

        {/* Title */}
        {title && (
          <h1 className="flex-1 text-lg font-bold font-['Space_Grotesk'] truncate" style={{ color: 'var(--t-on-surface)' }}>
            {title}
          </h1>
        )}

        {!title && <div className="flex-1" />}

        {/* Right section */}
        <div className="flex items-center gap-2">
          {showNotifications && (
            <button
              className={[
                'w-10 h-10 flex items-center justify-center rounded-full',
                'active:translate-x-[1px] active:translate-y-[1px]',
                'transition-all duration-100 cursor-pointer',
              ].join(' ')}
              style={{
                border: '2px solid var(--t-border)',
                background: 'var(--t-card-bg)',
                boxShadow: '2px 2px 0px 0px var(--t-shadow)',
              }}
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--t-on-surface)' }}>notifications</span>
            </button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
}

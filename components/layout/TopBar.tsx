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
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#fcf9f8] border-b-2 border-[#1c1b1b] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
      <div className="max-w-[600px] mx-auto h-16 flex items-center px-4 gap-3">
        {/* Left section */}
        {showBack && (
          <button
            onClick={() => router.back()}
            className={[
              'w-10 h-10 flex items-center justify-center rounded-full',
              'border-2 border-[#1c1b1b] bg-white',
              'shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
              'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]',
              'transition-all duration-100 cursor-pointer',
            ].join(' ')}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
        )}

        {/* Title */}
        {title && (
          <h1 className="flex-1 text-lg font-bold font-['Space_Grotesk'] text-[#1c1b1b] truncate">
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
                'border-2 border-[#1c1b1b] bg-white',
                'shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
                'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]',
                'transition-all duration-100 cursor-pointer',
              ].join(' ')}
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
}

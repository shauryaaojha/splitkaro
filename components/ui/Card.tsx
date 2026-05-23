'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  pressable?: boolean;
}

export default function Card({
  children,
  className = '',
  onClick,
  pressable = false,
}: CardProps) {
  const isPressable = pressable || !!onClick;

  return (
    <div
      role={isPressable ? 'button' : undefined}
      tabIndex={isPressable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isPressable
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={[
        'bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] p-4',
        isPressable
          ? 'cursor-pointer transition-all duration-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

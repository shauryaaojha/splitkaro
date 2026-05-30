'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  pressable?: boolean;
}

export default function Card({
  children,
  className = '',
  style,
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
        'rounded-2xl p-4',
        isPressable
          ? 'cursor-pointer transition-all duration-100 active:translate-x-[1px] active:translate-y-[1px]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: 'var(--t-card-bg)',
        border: '2px solid var(--t-border)',
        boxShadow: '2px 2px 0px 0px var(--t-shadow)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

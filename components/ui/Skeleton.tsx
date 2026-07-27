'use client';

import React from 'react';

type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
};

export default function Skeleton({
  className = '',
  variant = 'text',
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        'animate-pulse',
        variantClasses[variant],
        className,
      ].join(' ')}
      style={{ background: 'var(--t-surface-3)' }}
    />
  );
}

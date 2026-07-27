'use client';

import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

// Theme variables so badges stay legible in both light and dark mode
const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  primary: { background: 'var(--t-primary)', color: '#fff' },
  secondary: { background: 'var(--t-accent)', color: '#fff' },
  success: { background: 'var(--t-success-bg)', color: 'var(--t-success)' },
  error: { background: 'var(--t-danger-bg)', color: 'var(--t-danger)' },
  neutral: { background: 'var(--t-surface-3)', color: 'var(--t-on-surface)' },
};

export default function Badge({
  children,
  variant = 'neutral',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider font-['Space_Grotesk']",
        className,
      ].join(' ')}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}

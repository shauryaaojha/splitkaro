'use client';

import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-[#aa3000] text-white',
  secondary: 'bg-[#5d5c74] text-white',
  success: 'bg-[#1A893D] text-[#E8F8EE]',
  error: 'bg-[#ffdad6] text-[#ba1a1a]',
  neutral: 'bg-[#eae7e7] text-[#1c1b1b]',
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
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

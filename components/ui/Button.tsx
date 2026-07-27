'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: string;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white border-2',
  ghost: 'bg-transparent border-2',
  danger: 'text-white border-2',
};

// Theme variables so buttons stay legible in dark mode
const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--t-primary)', borderColor: 'var(--t-border)' },
  ghost: { color: 'var(--t-on-surface)', borderColor: 'var(--t-accent)' },
  danger: { background: 'var(--t-danger)', borderColor: 'var(--t-border)' },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm gap-1.5',
  md: 'h-12 px-6 text-base gap-2',
  lg: 'h-14 px-8 text-lg gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center rounded-full font-bold font-['Space_Grotesk'] tracking-wide",
        'transition-all duration-100',
        'active:translate-x-[1px] active:translate-y-[1px]',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed active:translate-x-0 active:translate-y-0' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        boxShadow: '2px 2px 0px 0px var(--t-shadow)',
        ...variantStyles[variant],
      }}
      {...rest}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[20px]">
          progress_activity
        </span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

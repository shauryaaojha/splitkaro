'use client';

import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

const AVATAR_COLORS = [
  '#aa3000',
  '#5d5c74',
  '#1A893D',
  '#ba1a1a',
  '#0061a4',
  '#7e5260',
  '#006c4c',
  '#6b4fa0',
  '#835400',
  '#345ca8',
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

function getColorForName(name: string): string {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
}

export default function Avatar({
  src,
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const bgColor = getColorForName(name);

  return (
    <div
      className={[
        'rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0',
        "font-bold font-['Space_Grotesk']",
        sizeClasses[size],
        className,
      ].join(' ')}
      style={{
        borderColor: 'var(--t-border)',
        ...(!src ? { backgroundColor: bgColor, color: '#ffffff' } : {}),
      }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

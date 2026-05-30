'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  iconFilled: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home', iconFilled: 'home' },
  { href: '/groups', label: 'Groups', icon: 'group', iconFilled: 'group' },
  { href: '/activity', label: 'Activity', icon: 'notifications', iconFilled: 'notifications' },
  { href: '/profile', label: 'Profile', icon: 'person', iconFilled: 'person' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div
        className="max-w-[600px] mx-auto px-2 py-2"
        style={{
          background: 'var(--t-accent)',
          borderTop: '2px solid var(--t-border)',
        }}
      >
        <ul className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150',
                    "text-sm font-medium font-['DM_Sans']",
                  ].join(' ')}
                  style={active ? {
                    background: 'var(--t-primary)',
                    color: '#fff',
                    boxShadow: '2px 2px 0px 0px var(--t-shadow)',
                  } : {
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {active ? item.iconFilled : item.icon}
                  </span>
                  {active && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

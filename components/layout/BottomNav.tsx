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
      <div className="max-w-[600px] mx-auto bg-[#5d5c74] border-t-2 border-[#1c1b1b] px-2 py-2">
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
                    active
                      ? 'bg-[#aa3000] text-white shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]'
                      : 'text-white/80 hover:text-white',
                  ].join(' ')}
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

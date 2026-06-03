'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show on PWA (standalone) launch or first page load
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Show splash for 2s, then fade out over 0.5s
    const fadeTimer = setTimeout(() => setFadeOut(true), isPWA ? 2000 : 1400);
    const hideTimer = setTimeout(() => setVisible(false), isPWA ? 2600 : 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fcf9f8',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      {/* Animated logo container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          animation: 'sk-splash-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {/* App Icon */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            border: '3px solid #1c1b1b',
            boxShadow: '4px 4px 0px 0px #1c1b1b',
            overflow: 'hidden',
            flexShrink: 0,
            animation: 'sk-icon-pulse 1.8s ease-in-out 0.6s infinite',
          }}
        >
          <Image
            src="/icons/icon-512.png"
            alt="SplitKaro"
            width={96}
            height={96}
            priority
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Wordmark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: '#1c1b1b',
              letterSpacing: '-0.5px',
              lineHeight: 1,
            }}
          >
            Split<span style={{ color: '#aa3000' }}>Karo</span>
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 12,
              color: '#5d5c74',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Dosto ke saath, hisaab saaf.
          </span>
        </div>

        {/* Loading dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: 'block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#aa3000',
                animation: `sk-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes sk-splash-enter {
          from { opacity: 0; transform: translateY(20px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes sk-dot-bounce {
          0%, 80%, 100% { transform: scale(1);   opacity: 0.4; }
          40%            { transform: scale(1.5); opacity: 1;   }
        }
        @keyframes sk-icon-pulse {
          0%, 100% { box-shadow: 4px 4px 0px 0px #1c1b1b; }
          50%       { box-shadow: 6px 6px 0px 0px #aa3000; }
        }
      `}</style>
    </div>
  );
}

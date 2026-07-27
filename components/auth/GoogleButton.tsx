'use client';

import { useState } from 'react';

interface GoogleButtonProps {
  /** Label — "Continue with Google" reads right for both login and signup */
  label?: string;
  /** In-app path to land on after sign-in; falls back to `?redirect=` in the URL */
  redirectTo?: string;
}

/**
 * Starts the server-side Google OAuth flow.
 *
 * A full page navigation (not fetch) so the browser follows Google's redirect
 * chain and our HTTP-only cookies are set along the way.
 */
export default function GoogleButton({
  label = 'Continue with Google',
  redirectTo,
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);

    const target =
      redirectTo ?? new URLSearchParams(window.location.search).get('redirect');
    const params = new URLSearchParams();
    if (target) params.set('redirect', target);

    const query = params.toString();
    window.location.href = `/api/auth/google${query ? `?${query}` : ''}`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={[
        "inline-flex w-full h-14 items-center justify-center gap-3 rounded-full font-bold font-['Space_Grotesk'] tracking-wide text-base",
        'bg-white text-[#1c1b1b] border-2 border-[#1c1b1b]',
        'shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
        'transition-all duration-100',
        'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]',
        loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[20px]">
          progress_activity
        </span>
      ) : (
        <GoogleGlyph />
      )}
      {loading ? 'Redirecting…' : label}
    </button>
  );
}

/** Google's four-colour "G", inlined so it works offline / as a PWA */
function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

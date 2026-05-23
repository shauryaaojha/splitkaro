'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import OtpInput from '@/components/ui/OtpInput';
import { useAuth } from '@/hooks/useAuth';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const redirectTo = searchParams.get('redirect') ?? '/';

  const { mutate } = useAuth();

  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [resending, setResending] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid OTP');
        if (data.error?.includes('expired')) {
          setOtp('');
        }
        return;
      }

      // Mutate the auth state so SWR knows the user is logged in
      await mutate();

      router.push(redirectTo.startsWith('/') ? redirectTo : '/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to resend OTP');
        return;
      }

      setCountdown(RESEND_COUNTDOWN);
      setOtp('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="w-full max-w-[600px] mx-auto px-4 text-center">
        <div className="brutalist-card p-8">
          <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-4">error</span>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] mb-2">
            No Email Provided
          </h2>
          <p className="text-[#5d5c74] font-['DM_Sans'] mb-6">
            Please start from the login page.
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[600px] mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-[#5d5c74] font-['DM_Sans'] text-sm hover:text-[#1c1b1b] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back
        </Link>
        <div className="w-10 h-10 bg-[#aa3000] border-2 border-[#1c1b1b] rounded-xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] flex items-center justify-center">
          <span className="text-white text-sm font-bold font-['Syne']">S</span>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#aa3000]/10 border-2 border-[#aa3000] rounded-full mb-4">
          <span className="material-symbols-outlined text-[32px] text-[#aa3000]">mark_email_read</span>
        </div>
        <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] mb-2">
          Check your inbox
        </h1>
        <p className="text-[#5d5c74] font-['DM_Sans']">
          We sent a 6-digit code to
        </p>
        <p className="font-bold font-['DM_Sans'] text-[#1c1b1b] mt-1">{email}</p>
      </div>

      {/* Error block for verification flow errors */}
      {error && !error.includes('expired') && (
        <div className="mb-4 p-3 bg-[#ba1a1a]/10 border-2 border-[#ba1a1a] rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">error</span>
          <p className="text-sm text-[#ba1a1a] font-['DM_Sans']">{error}</p>
        </div>
      )}

      {/* OTP Input component usage */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <OtpInput
            length={OTP_LENGTH}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              setError('');
            }}
            error={error}
          />
        </div>

        {/* Resend countdown */}
        <div className="text-center mb-6">
          {countdown > 0 ? (
            <p className="text-sm text-[#5d5c74] font-['DM_Sans']">
              Resend code in{' '}
              <span className="font-bold font-['JetBrains_Mono'] text-[#aa3000]">
                {countdown}s
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-[#aa3000] font-bold font-['DM_Sans'] hover:underline cursor-pointer disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          loading={loading}
          icon="verified"
          size="lg"
        >
          Verify &amp; Continue
        </Button>
      </form>

      {/* Security note */}
      <div className="mt-8 flex items-center justify-center gap-2 text-[#5d5c74]">
        <span className="material-symbols-outlined text-[18px]">lock</span>
        <p className="text-xs font-['DM_Sans']">Secure verification process</p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[600px] mx-auto px-4 text-center">
          <div className="skeleton h-8 w-48 mx-auto mb-4" />
          <div className="skeleton h-4 w-64 mx-auto mb-8" />
          <div className="flex justify-center gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton w-12 h-14 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

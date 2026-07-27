'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GoogleButton from '@/components/auth/GoogleButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  // Seeded with any failure bounced back from the Google OAuth callback
  const [error, setError] = useState(searchParams.get('error') ?? '');
  const [loading, setLoading] = useState(false);

  // Drop the message from the URL so a refresh doesn't resurrect it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('error')) return;

    params.delete('error');
    const query = params.toString();
    window.history.replaceState(null, '', query ? `/login?${query}` : '/login');
  }, []);

  function validate(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const verifyParams = new URLSearchParams({
        email: email.trim().toLowerCase(),
      });
      if (redirect) verifyParams.set('redirect', redirect);
      router.push(`/verify?${verifyParams.toString()}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[600px] mx-auto px-4">
      {/* Logo area */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 bg-[#aa3000] border-2 border-[#1c1b1b] rounded-2xl shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] flex items-center justify-center">
          <span className="text-white text-2xl font-bold font-['Syne']">S</span>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] mb-2">
          Welcome Back
        </h1>
        <p className="text-[#5d5c74] font-['DM_Sans']">
          Enter your email to receive a login OTP
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-[#ba1a1a]/10 border-2 border-[#ba1a1a] rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">error</span>
          <p className="text-sm text-[#ba1a1a] font-['DM_Sans']">{error}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="brutalist-card p-6 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email Address"
            icon="mail"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon="send"
            size="lg"
          >
            Send OTP
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-[2px] bg-[#1c1b1b]/15" />
          <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5d5c74]">
            or
          </span>
          <span className="flex-1 h-[2px] bg-[#1c1b1b]/15" />
        </div>

        <GoogleButton label="Continue with Google" />
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-[#5d5c74] font-['DM_Sans']">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#aa3000] font-bold hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[600px] mx-auto px-4">
          <div className="skeleton h-16 w-16 rounded-2xl mx-auto mb-8" />
          <div className="skeleton h-8 w-48 mx-auto mb-4" />
          <div className="skeleton h-4 w-64 mx-auto mb-8" />
          <div className="skeleton h-48 w-full rounded-xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

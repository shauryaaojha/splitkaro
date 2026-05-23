'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GoogleButton from '@/components/auth/GoogleButton';

interface FormErrors {
  name?: string;
  email?: string;
  upiId?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiId.trim() || !upiRegex.test(upiId)) {
      newErrors.upiId = 'Invalid UPI ID (e.g., name@upi)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), upiId: upiId.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || 'Something went wrong' });
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
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[600px] mx-auto px-4">
      {/* Back button */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-ink-muted mb-6 font-['DM_Sans'] text-sm hover:text-ink transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Back to Login
      </Link>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-ink mb-2">
          Create Account
        </h1>
        <p className="text-ink-muted font-['DM_Sans']">
          Join SplitKaro to start splitting expenses with friends
        </p>
      </div>

      {/* General error */}
      {errors.general && (
        <div className="mb-4 p-3 bg-[#ba1a1a]/10 border-2 border-danger rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-danger text-[20px]">error</span>
          <p className="text-sm text-danger font-['DM_Sans']">{errors.general}</p>
        </div>
      )}

      {/* Google signup — fastest path, so it leads */}
      <div className="brutalist-card p-6 mb-6">
        <GoogleButton label="Sign up with Google" />
        <p className="text-xs text-ink-muted font-['DM_Sans'] text-center mt-3">
          Already signed up with this email? We&apos;ll reconnect you to your
          existing account.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-5">
          <span className="flex-1 h-[2px] bg-[#1c1b1b]/15" />
          <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-ink-muted">
            or sign up with email
          </span>
          <span className="flex-1 h-[2px] bg-[#1c1b1b]/15" />
        </div>
      </div>

      {/* Form Card */}
      <div className="brutalist-card p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            icon="person"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            label="Email Address"
            icon="mail"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="UPI ID"
            icon="alternate_email"
            placeholder="name@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            error={errors.upiId}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon="send"
            size="lg"
            className="mt-2"
          >
            Send OTP
          </Button>
        </form>
      </div>

      {/* Why UPI info card */}
      <div className="bg-[#FFF3CD] border-2 border-ink rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] rotate-[-1deg] mb-8">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[#856404] text-[24px] mt-0.5">info</span>
          <div>
            <p className="font-bold font-['Space_Grotesk'] text-[#856404] text-sm mb-1">
              Why UPI?
            </p>
            <p className="text-xs text-[#856404]/80 font-['DM_Sans'] leading-relaxed">
              We use your UPI ID to generate QR codes for quick settlements. 
              Your friends can pay you directly — no middleman, no fees.
            </p>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-ink-muted font-['DM_Sans']">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-ink font-bold hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}

'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

interface FormErrors {
  name?: string;
  upiId?: string;
  general?: string;
}

/**
 * Post-Google-signup step.
 *
 * Google gives us a name and email but not a UPI ID, which the email signup
 * form requires and settlements depend on — so we collect it here before the
 * user reaches the app.
 */
function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';

  const { user, isLoading, mutate } = useAuth();

  // `null` means untouched, so the field shows whatever name Google gave us
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const name = nameInput ?? user?.name ?? '';

  // Nothing to complete — send them on their way
  useEffect(() => {
    if (!isLoading && user?.upiId) {
      router.replace(redirectTo.startsWith('/') ? redirectTo : '/');
    }
  }, [isLoading, user?.upiId, redirectTo, router]);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiId.trim() || !upiRegex.test(upiId.trim())) {
      newErrors.upiId = 'Invalid UPI ID (e.g., name@upi)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrors({});

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), upiId: upiId.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || 'Something went wrong' });
        return;
      }

      await mutate();
      router.replace(redirectTo.startsWith('/') ? redirectTo : '/');
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-[600px] mx-auto px-4">
      {/* Heading */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#aa3000]/10 border-2 border-[#aa3000] rounded-full mb-4">
          <span className="material-symbols-outlined text-[32px] text-[#aa3000]">
            waving_hand
          </span>
        </div>
        <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] mb-2">
          One last thing
        </h1>
        <p className="text-[#5d5c74] font-['DM_Sans']">
          {user?.email
            ? `Signed in as ${user.email}`
            : 'Add your UPI ID so friends can pay you back'}
        </p>
      </div>

      {/* General error */}
      {errors.general && (
        <div className="mb-4 p-3 bg-[#ba1a1a]/10 border-2 border-[#ba1a1a] rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">
            error
          </span>
          <p className="text-sm text-[#ba1a1a] font-['DM_Sans']">{errors.general}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="brutalist-card p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            icon="person"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setNameInput(e.target.value)}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            label="UPI ID"
            icon="alternate_email"
            placeholder="name@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            error={errors.upiId}
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            loading={saving}
            icon="check"
            size="lg"
            className="mt-2"
          >
            Finish Setup
          </Button>
        </form>
      </div>

      {/* Why UPI info card */}
      <div className="bg-[#FFF3CD] border-2 border-[#1c1b1b] rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] rotate-[-1deg]">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[#856404] text-[24px] mt-0.5">
            info
          </span>
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
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[600px] mx-auto px-4">
          <div className="skeleton h-8 w-48 mx-auto mb-4" />
          <div className="skeleton h-4 w-64 mx-auto mb-8" />
          <div className="skeleton h-40 w-full rounded-xl" />
        </div>
      }
    >
      <CompleteProfileContent />
    </Suspense>
  );
}

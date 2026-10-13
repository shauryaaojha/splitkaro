'use client';

import React, { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { detectPlatform, type Platform } from '@/lib/platform';
import {
  IOS_UPI_APPS,
  buildAndroidIntentUrl,
  buildAppBridgeUrl,
  buildIosAppUrl,
  buildUpiUrl,
} from '@/lib/upi';

interface UpiPayButtonsProps {
  payeeUpiId: string;
  payeeName: string;
  amount: number;
  /** Path the Android app returns to with the UPI result appended */
  returnPath: string;
  /** Called when the payer confirms a payment that has no app-reported result */
  onConfirmPaid: () => void;
  confirming: boolean;
}

/**
 * Launches a UPI app the best way each platform allows:
 * - Android app: native bridge that reports the result back (handled by the page).
 * - Android browser: intent:// chooser; no result, so we ask on return.
 * - iOS: one button per UPI app; no result, so we ask on return.
 * - Desktop: nothing to launch, the QR code below is the way to pay.
 */
export default function UpiPayButtons({
  payeeUpiId,
  payeeName,
  amount,
  returnPath,
  onConfirmPaid,
  confirming,
}: UpiPayButtonsProps) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [askConfirm, setAskConfirm] = useState(false);
  // 'launched' after a browser launch, 'away' once the UPI app took over the screen.
  const launchState = useRef<'idle' | 'launched' | 'away'>('idle');

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setPlatform(detectPlatform());
    });
    return () => {
      active = false;
    };
  }, []);

  // Browsers can't hear back from the UPI app; when the payer comes back after
  // the UPI app was in front, ask whether the payment went through.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (launchState.current === 'launched') launchState.current = 'away';
      } else if (launchState.current === 'away') {
        launchState.current = 'idle';
        setAskConfirm(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (!platform || platform === 'desktop') return null;

  const upiUrl = buildUpiUrl({ pa: payeeUpiId, pn: payeeName, am: amount.toFixed(2) });

  const launch = (url: string, expectsResult: boolean) => {
    launchState.current = expectsResult ? 'idle' : 'launched';
    window.location.assign(url);
  };

  if (askConfirm) {
    return (
      <div
        className="flex flex-col gap-3 p-5 rounded-2xl mx-4"
        style={{
          background: 'var(--t-card-bg)',
          border: '2px solid var(--t-border)',
          boxShadow: '2px 2px 0px 0px var(--t-shadow)',
        }}
      >
        <p className="font-bold font-['Space_Grotesk'] text-sm text-center" style={{ color: 'var(--t-on-surface)' }}>
          Did your ₹{amount.toFixed(2)} payment to {payeeName} go through?
        </p>
        <Button
          variant="primary"
          size="md"
          fullWidth
          icon="check_circle"
          loading={confirming}
          disabled={confirming}
          onClick={onConfirmPaid}
        >
          Yes, I paid
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={() => setAskConfirm(false)} disabled={confirming}>
          No, not yet
        </Button>
      </div>
    );
  }

  if (platform === 'ios') {
    return (
      <div className="flex flex-col gap-2 w-full max-w-[360px] mx-auto px-4">
        <span
          className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-center"
          style={{ color: 'var(--t-on-surface-muted)' }}
        >
          Pay with
        </span>
        <div className="grid grid-cols-2 gap-2">
          {IOS_UPI_APPS.map((app) => (
            <Button
              key={app.id}
              variant={app.id === 'other' ? 'ghost' : 'primary'}
              size="md"
              fullWidth
              onClick={() => launch(buildIosAppUrl(upiUrl, app.prefix), false)}
            >
              {app.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const inApp = platform === 'android-app';

  return (
    <div className="flex flex-col gap-2 w-full max-w-[360px] mx-auto px-4">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon="account_balance_wallet"
        onClick={() =>
          launch(inApp ? buildAppBridgeUrl(upiUrl, returnPath) : buildAndroidIntentUrl(upiUrl), inApp)
        }
      >
        Pay ₹{amount.toFixed(2)} via UPI
      </Button>
      <p className="text-[11px] font-['DM_Sans'] text-center" style={{ color: 'var(--t-on-surface-muted)' }}>
        {inApp
          ? 'Pick any UPI app. The settlement is recorded automatically when the payment succeeds.'
          : 'Opens your UPI apps. Come back here after paying to record it.'}
      </p>
    </div>
  );
}

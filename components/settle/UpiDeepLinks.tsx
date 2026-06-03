'use client';

import React from 'react';
import { buildUpiUrl } from '@/lib/upi';

interface UpiDeepLinksProps {
  payeeUpiId: string;
  payeeName: string;
  amount: number;
}

export default function UpiDeepLinks({
  payeeUpiId,
  payeeName,
  amount,
}: UpiDeepLinksProps) {
  const params = {
    pa: payeeUpiId,
    pn: payeeName,
    am: amount.toFixed(2),
  };

  const upiUrl = buildUpiUrl(params);

  const handlePay = () => {
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isAndroid) {
      // Chrome on Android (including PWA standalone mode) blocks upi:// anchor tags.
      // The Android Intent URL format is processed natively by Chrome and bypasses this.
      // Strip "upi://pay?" prefix and rebuild as intent URL.
      const queryString = upiUrl.replace('upi://pay?', '');
      const intentUrl = `intent://pay?${queryString}#Intent;scheme=upi;end`;
      console.log('[UPI] Android intent URL:', intentUrl);
      window.location.href = intentUrl;
    } else {
      // iOS: UPI apps register upi:// in their Info.plist — direct scheme works fine.
      console.log('[UPI] iOS upi:// URL:', upiUrl);
      window.location.href = upiUrl;
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-[360px] mx-auto px-4 mt-2">
      <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] text-center">
        Pay via Mobile App
      </span>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handlePay}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#aa3000] hover:bg-[#c45a2d] text-white border-2 border-[#1c1b1b] rounded-full shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          Pay via any UPI App
        </button>
      </div>
    </div>
  );
}

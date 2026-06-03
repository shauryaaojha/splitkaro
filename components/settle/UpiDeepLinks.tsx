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
    tn: `SplitKaro Settlement`,
  };

  const upiUrl = buildUpiUrl(params);

  return (
    <div className="flex flex-col gap-3 w-full max-w-[360px] mx-auto px-4 mt-2">
      <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] text-center">
        Pay via Mobile App
      </span>

      <div className="flex flex-col gap-3">
        {/* Generic UPI */}
        <a
          href={upiUrl}
          onClick={() => {
            console.log("Opening UPI Link:", upiUrl, "for Payee:", payeeUpiId);
          }}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#aa3000] hover:bg-[#c45a2d] text-white border-2 border-[#1c1b1b] rounded-full shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          Pay via any UPI App
        </a>
      </div>
    </div>
  );
}

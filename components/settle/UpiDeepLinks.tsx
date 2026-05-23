'use client';

import React from 'react';
import { buildUpiUrl, buildGPayUrl, buildPhonePeUrl, buildPaytmUrl } from '@/lib/upi';

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

  const handlePay = (urlBuilder: typeof buildUpiUrl) => {
    try {
      const url = urlBuilder(params);
      window.location.href = url;
    } catch (err) {
      console.error("Deep link failed to open:", err);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-[360px] mx-auto px-4 mt-2">
      <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] text-center">
        Pay via Mobile App
      </span>

      <div className="grid grid-cols-2 gap-3">
        {/* Google Pay */}
        <button
          type="button"
          onClick={() => handlePay(buildGPayUrl)}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1967D2] border-2 border-[#1c1b1b] rounded-full shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          GPay
        </button>

        {/* PhonePe */}
        <button
          type="button"
          onClick={() => handlePay(buildPhonePeUrl)}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#F3E5F5] hover:bg-[#E1BEE7] text-[#7B1FA2] border-2 border-[#1c1b1b] rounded-full shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]"
        >
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          PhonePe
        </button>

        {/* Paytm */}
        <button
          type="button"
          onClick={() => handlePay(buildPaytmUrl)}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#E0F7FA] hover:bg-[#B2EBF2] text-[#00838F] border-2 border-[#1c1b1b] rounded-full shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]"
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
          Paytm
        </button>

        {/* Generic UPI */}
        <button
          type="button"
          onClick={() => handlePay(buildUpiUrl)}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#aa3000] hover:bg-[#c45a2d] text-white border-2 border-[#1c1b1b] rounded-full shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all font-bold text-sm font-['Space_Grotesk'] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          Any UPI
        </button>
      </div>
    </div>
  );
}

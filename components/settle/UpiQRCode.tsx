'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

interface UpiQRCodeProps {
  payeeUpiId: string;
  payeeName: string;
  amount: number;
}

export default function UpiQRCode({
  payeeUpiId,
  payeeName,
  amount,
}: UpiQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQRCode() {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          pa: payeeUpiId,
          pn: payeeName,
          am: amount.toFixed(2),
        });

        const res = await fetch(`/api/upi/qr?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to generate QR code');
        }

        const json = await res.json();
        setQrDataUrl(json.data.qrDataUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate QR code';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (payeeUpiId && payeeName && amount > 0) {
      loadQRCode();
    }
  }, [payeeUpiId, payeeName, amount]);

  return (
    <Card className="flex flex-col items-center justify-center p-6 bg-white max-w-[320px] mx-auto text-center border-2 border-[#1c1b1b]">
      <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] mb-4">
        Scan QR to Pay
      </span>

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-[200px] h-[200px] rounded-lg" />
          <Skeleton className="w-[100px] h-4 mt-2" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-[#ba1a1a]">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <span className="text-xs font-bold font-['Space_Grotesk']">{error}</span>
        </div>
      ) : qrDataUrl ? (
        <div className="flex flex-col items-center">
          <div className="border-4 border-[#1c1b1b] rounded-xl overflow-hidden bg-white p-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] mb-4">
            <img
              src={qrDataUrl}
              alt="UPI QR Code"
              className="w-[200px] h-[200px]"
            />
          </div>
          <span className="text-xs font-bold text-[#5d5c74] font-['Space_Grotesk']">
            Payee: {payeeName}
          </span>
          <span className="text-xs text-[#5d5c74] font-semibold mt-0.5">
            {payeeUpiId}
          </span>
          <span className="text-2xl font-['Syne'] font-extrabold text-[#aa3000] mt-3">
            ₹{amount.toFixed(2)}
          </span>
        </div>
      ) : null}
    </Card>
  );
}

'use client';

import React from 'react';
import Card from '@/components/ui/Card';

interface BalanceSummaryCardProps {
  totalOwed: number;  // Others owe me (positive credit)
  totalOwing: number; // I owe others (debt)
  netBalance: number;
}

export default function BalanceSummaryCard({
  totalOwed,
  totalOwing,
  netBalance,
}: BalanceSummaryCardProps) {
  const isCreditor = netBalance > 0;
  const absNet = Math.abs(netBalance);

  return (
    <div className="relative w-full">
      <Card className="relative overflow-hidden bg-[#1a1a2e] text-[#fcf9f8] border-2 border-[#1c1b1b] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] px-6 py-8 rounded-2xl flex flex-col gap-6">
        {/* Grid pattern background overlay */}
        <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />

        {/* Header and Rotated Badge */}
        <div className="relative flex justify-between items-start z-10">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#e3e1f9]/60">
              Net Shared Balance
            </span>
            <span className="text-4xl font-['Syne'] font-extrabold text-white mt-1.5 select-all">
              ₹{absNet.toFixed(2)}
            </span>
          </div>

          {netBalance !== 0 && (
            <div
              className={[
                'px-3.5 py-1.5 rounded-full border-2 border-[#1c1b1b] text-xs font-bold font-["Space_Grotesk"] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] uppercase tracking-wider transform rotate-[4deg]',
                isCreditor
                  ? 'bg-[#1b6d30] text-[#a4f6a8]'
                  : 'bg-[#ba1a1a] text-[#ffdad6]',
              ].join(' ')}
            >
              {isCreditor ? "You get back" : "You owe"}
            </div>
          )}

          {netBalance === 0 && (
            <div className="px-3.5 py-1.5 rounded-full border-2 border-[#1c1b1b] text-xs font-bold font-['Space_Grotesk'] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] uppercase tracking-wider bg-[#5d5c74] text-white transform rotate-[-3deg]">
              All Settled
            </div>
          )}
        </div>

        {/* Footer section showing breakdown */}
        <div className="relative grid grid-cols-2 gap-4 border-t border-white/10 pt-5 z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk'] text-white/50">
              You owe
            </span>
            <span className="text-lg font-['Syne'] font-bold text-[#ffdad6] mt-0.5">
              ₹{totalOwing.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-4">
            <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk'] text-white/50">
              You&apos;re owed
            </span>
            <span className="text-lg font-['Syne'] font-bold text-[#a4f6a8] mt-0.5">
              ₹{totalOwed.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

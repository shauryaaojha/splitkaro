'use client';

import React from 'react';

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
      <div
        className="relative overflow-hidden px-6 py-8 rounded-2xl flex flex-col gap-6"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
          border: '2px solid var(--t-border)',
          boxShadow: '4px 4px 0px 0px var(--t-shadow)',
          color: '#fcf9f8',
        }}
      >
        {/* Animated grid pattern overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        
        {/* Glowing accent orb */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, var(--t-primary) 0%, transparent 70%)',
          opacity: 0.3,
          filter: 'blur(20px)',
        }} />

        {/* Header: Net Balance + Badge */}
        <div className="relative flex justify-between items-start z-10">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Net Shared Balance
            </span>
            <span className="text-4xl font-['Syne'] font-extrabold text-white mt-1.5 select-all tracking-tight">
              ₹{absNet.toFixed(2)}
            </span>
          </div>

          {netBalance !== 0 && (
            <div
              className="px-3.5 py-1.5 rounded-full border-2 text-xs font-bold font-['Space_Grotesk'] uppercase tracking-wider transform rotate-[4deg]"
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                boxShadow: '2px 2px 0px rgba(0,0,0,0.4)',
                background: isCreditor ? 'rgba(46, 232, 138, 0.2)' : 'rgba(255, 95, 78, 0.2)',
                color: isCreditor ? '#2ee88a' : '#ff5f4e',
                backdropFilter: 'blur(4px)',
              }}
            >
              {isCreditor ? "You get back" : "You owe"}
            </div>
          )}

          {netBalance === 0 && (
            <div
              className="px-3.5 py-1.5 rounded-full border-2 text-xs font-bold font-['Space_Grotesk'] uppercase tracking-wider bg-white/10 text-white transform rotate-[-3deg]"
              style={{ borderColor: 'rgba(255,255,255,0.3)', boxShadow: '2px 2px 0px rgba(0,0,0,0.4)' }}
            >
              All Settled
            </div>
          )}
        </div>

        {/* Footer: Owe / Owed breakdown */}
        <div className="relative grid grid-cols-2 gap-4 z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
          {/* You Owe (red) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse-ring" style={{ background: '#ff5f4e' }} />
              <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'rgba(255,255,255,0.5)' }}>
                You owe
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-['Syne'] font-bold" style={{ color: '#ff5f4e', textShadow: '0 0 20px rgba(255,95,78,0.5)' }}>
                ₹{totalOwing.toFixed(2)}
              </span>
            </div>
            {totalOwing > 0 && (
              <div className="text-[9px] font-bold uppercase font-['Space_Grotesk'] px-2 py-0.5 rounded-full w-fit" style={{ background: 'rgba(255,95,78,0.15)', color: '#ff5f4e', border: '1px solid rgba(255,95,78,0.3)' }}>
                Pay back
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="flex flex-col gap-1 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse-ring" style={{ background: '#2ee88a', animationDelay: '0.9s' }} />
              <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk']" style={{ color: 'rgba(255,255,255,0.5)' }}>
                You&apos;re owed
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-['Syne'] font-bold" style={{ color: '#2ee88a', textShadow: '0 0 20px rgba(46,232,138,0.5)' }}>
                ₹{totalOwed.toFixed(2)}
              </span>
            </div>
            {totalOwed > 0 && (
              <div className="text-[9px] font-bold uppercase font-['Space_Grotesk'] px-2 py-0.5 rounded-full w-fit" style={{ background: 'rgba(46,232,138,0.15)', color: '#2ee88a', border: '1px solid rgba(46,232,138,0.3)' }}>
                Collect
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

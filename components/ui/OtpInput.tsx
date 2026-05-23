'use client';

import React, { useRef, useCallback } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  error?: string;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  error,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      inputsRef.current[clamped]?.focus();
    },
    [length]
  );

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (char && !/^\d$/.test(char)) return;

      const newDigits = [...digits];
      newDigits[index] = char;
      const newOtp = newDigits.join('');
      onChange(newOtp);

      if (char && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [digits, onChange, length, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (digits[index]) {
          handleChange(index, '');
        } else if (index > 0) {
          handleChange(index - 1, '');
          focusInput(index - 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [digits, handleChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text/plain')
        .replace(/\D/g, '')
        .slice(0, length);
      if (pasted) {
        onChange(pasted.padEnd(length, '').slice(0, length).replace(/ /g, ''));
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [length, onChange, focusInput]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
        {Array.from({ length }).map((_, i) => {
          const filled = !!digits[i];
          return (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[i] || ''}
              onChange={(e) => handleChange(i, e.target.value.slice(-1))}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${i + 1}`}
              className={[
                "w-[48px] h-[56px] text-center font-['Space_Grotesk'] text-2xl font-semibold",
                'border-2 rounded-lg outline-none',
                'transition-all duration-150',
                'focus:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] focus:-translate-x-[1px] focus:-translate-y-[1px]',
                'shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
                error
                  ? 'border-[#ba1a1a] bg-[#ffdad6]'
                  : filled
                    ? 'border-[#aa3000] bg-[#ffdbd0] text-[#aa3000]'
                    : 'border-[#1c1b1b] bg-[#fcf9f8] text-[#1c1b1b]',
              ].join(' ')}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-[#ba1a1a] font-['DM_Sans'] text-center flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

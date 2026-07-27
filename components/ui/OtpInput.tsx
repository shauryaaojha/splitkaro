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
  value = '',
  onChange,
  error,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Safe split that handles undefined or null values
  const digits = (value || '').split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      inputsRef.current[clamped]?.focus();
    },
    [length]
  );

  const handleChange = useCallback(
    (index: number, char: string) => {
      // Allow only numbers
      if (char && !/^\d$/.test(char)) return;

      const newDigits = [...digits];
      newDigits[index] = char;
      const newOtp = newDigits.join('');
      onChange(newOtp);

      // Shift focus forward if we entered a digit
      if (char && index < length - 1) {
        // Use timeout to ensure DOM update is finished
        setTimeout(() => {
          focusInput(index + 1);
        }, 10);
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
        onChange(pasted.padEnd(length, '').slice(0, length));
        // Focus the last filled box or the next empty one
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [length, onChange, focusInput]
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <div 
        className="grid grid-cols-6 gap-2 sm:gap-3 w-full max-w-[360px] xs:max-w-[400px] sm:max-w-[440px] mx-auto py-2"
        onPaste={handlePaste}
      >
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
                "w-full aspect-[4/5] text-center font-['Space_Grotesk'] text-xl xs:text-2xl sm:text-3xl font-bold",
                "border-2 sm:border-[3px] rounded-xl outline-none transition-all duration-150 select-all",
                "focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[4px_4px_0px_0px_rgba(28,27,27,1)] focus:border-primary focus:bg-primary-container/10",
                error
                  ? "border-error bg-error-container text-error shadow-[2px_2px_0px_0px_rgba(186,26,26,1)]"
                  : filled
                  ? "border-primary bg-primary-container text-primary shadow-[2px_2px_0px_0px_rgba(170,48,0,1)]"
                  : "border-ink bg-card text-ink shadow-[2px_2px_0px_0px_rgba(28,27,27,1)]",
              ].join(' ')}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-error font-['DM_Sans'] text-center flex items-center justify-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

'use client';

import React, { useId } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  icon?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', id: propId, ...rest }, ref) => {
    const autoId = useId();
    const id = propId ?? autoId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]"
          >
            {label}
          </label>
        )}
        <div
          className={[
            'flex items-center bg-[#fcf9f8] border-2 rounded-lg h-12 px-3 gap-2',
            'shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
            'transition-all duration-150',
            'focus-within:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] focus-within:-translate-x-[1px] focus-within:-translate-y-[1px]',
            error
              ? 'border-[#ba1a1a]'
              : 'border-[#1c1b1b]',
          ].join(' ')}
        >
          {icon && (
            <span className="material-symbols-outlined text-[20px] text-[#5d5c74]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={[
              "flex-1 bg-transparent outline-none text-[#1c1b1b] placeholder:text-[#5d5c74]/50 font-['DM_Sans'] text-base",
              className,
            ].join(' ')}
            {...rest}
          />
        </div>
        {error && (
          <p className="text-xs text-[#ba1a1a] font-['DM_Sans'] mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

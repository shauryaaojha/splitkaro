'use client';

import React from 'react';

type SplitType = 'equal' | 'exact' | 'percentage';

interface SplitTypeSelectorProps {
  value: SplitType;
  onChange: (type: SplitType) => void;
}

const OPTIONS: { value: SplitType; label: string; icon: string }[] = [
  { value: 'equal', label: 'Equal', icon: 'drag_handle' },
  { value: 'exact', label: 'Exact', icon: 'pin' },
  { value: 'percentage', label: '%', icon: 'percent' },
];

export default function SplitTypeSelector({
  value,
  onChange,
}: SplitTypeSelectorProps) {
  return (
    <div className="flex border-2 border-[#1c1b1b] rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] bg-[#fcf9f8]">
      {OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-bold font-['Space_Grotesk']",
              'transition-colors duration-150 cursor-pointer',
              isActive
                ? 'bg-[#aa3000] text-white'
                : 'bg-transparent text-[#5d5c74] hover:bg-[#eae7e7]',
              // Add borders between segments
              'border-r-2 border-[#1c1b1b] last:border-r-0',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-[18px]">
              {option.icon}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

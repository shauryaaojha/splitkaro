'use client';

import React, { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import SplitTypeSelector from './SplitTypeSelector';
import Avatar from '@/components/ui/Avatar';

type SplitType = 'equal' | 'exact' | 'percentage';

interface ExpenseFormProps {
  groupId: string;
  members: {
    userId: {
      _id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
    role: string;
  }[];
  onSubmit: (data: {
    description: string;
    amount: number;
    category: string;
    paidBy: string;
    date?: string;
    splits: { userId: string; share: number; splitType: SplitType }[];
  }) => Promise<void>;
  initialData?: {
    description: string;
    amount: number;
    category: string;
    paidBy: string;
    date?: string;
    splits: { userId: string; share: number; splitType: SplitType }[];
  };
}

const CATEGORIES = [
  { id: 'food', label: 'Food', emoji: '🍔' },
  { id: 'trip', label: 'Trip', emoji: '✈️' },
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'fun', label: 'Fun', emoji: '🎮' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export default function ExpenseForm({
  members,
  onSubmit,
  initialData,
}: ExpenseFormProps) {
  const initialSplitState = useMemo(() => {
    const initialIncluded: Record<string, boolean> = {};
    const initialCustom: Record<string, string> = {};

    members.forEach((member) => {
      const mId = member.userId._id;
      const foundSplit = initialData?.splits?.find((s) => s.userId === mId);
      initialIncluded[mId] = foundSplit ? foundSplit.share > 0 : true;
      initialCustom[mId] = foundSplit ? foundSplit.share.toString() : '';
    });

    return { included: initialIncluded, custom: initialCustom };
  }, [members, initialData]);

  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || 'other');
  const [paidBy, setPaidBy] = useState(initialData?.paidBy || (members[0]?.userId._id || ''));
  const [date, setDate] = useState(
    initialData?.date
      ? new Date(initialData.date).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  );
  const [splitType, setSplitType] = useState<SplitType>(
    (initialData?.splits[0]?.splitType as SplitType) || 'equal'
  );

  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>(
    () => initialSplitState.included
  );
  const [customSplits, setCustomSplits] = useState<Record<string, string>>(
    () => initialSplitState.custom
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Handle amount or split type changes to automatically distribute values
  const numericAmount = parseFloat(amount) || 0;

  // Calculate dynamic outputs for display
  const equalSelectedCount = Object.values(includedMembers).filter(Boolean).length;
  const equalShareValue = equalSelectedCount > 0 ? numericAmount / equalSelectedCount : 0;

  const handleToggleInclude = (memberId: string) => {
    setIncludedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleCustomSplitChange = (memberId: string, value: string) => {
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCustomSplits((prev) => ({
        ...prev,
        [memberId]: value,
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!amount || numericAmount <= 0) newErrors.amount = 'Enter a valid amount';
    if (!paidBy) newErrors.paidBy = 'Select who paid';

    if (splitType === 'equal' && equalSelectedCount === 0) {
      newErrors.splits = 'At least one member must be selected for equal split';
    }

    if (splitType === 'exact') {
      let sum = 0;
      members.forEach((m) => {
        sum += parseFloat(customSplits[m.userId._id] || '0') || 0;
      });
      const diff = Math.abs(sum - numericAmount);
      if (diff > 0.05) {
        newErrors.splits = `Sum of exact splits (₹${sum.toFixed(2)}) must equal total amount (₹${numericAmount.toFixed(2)})`;
      }
    }

    if (splitType === 'percentage') {
      let sum = 0;
      members.forEach((m) => {
        sum += parseFloat(customSplits[m.userId._id] || '0') || 0;
      });
      if (Math.abs(sum - 100) > 0.1) {
        newErrors.splits = `Sum of percentages (${sum.toFixed(1)}%) must equal 100%`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const finalSplits = members.map((member) => {
        const mId = member.userId._id;
        let share = 0;

        if (splitType === 'equal') {
          share = includedMembers[mId] ? equalShareValue : 0;
        } else if (splitType === 'exact') {
          share = parseFloat(customSplits[mId] || '0') || 0;
        } else if (splitType === 'percentage') {
          const pct = parseFloat(customSplits[mId] || '0') || 0;
          share = (pct / 100) * numericAmount;
        }

        // Round to 2 decimal places
        share = Math.round(share * 100) / 100;

        return {
          userId: mId,
          share,
          splitType,
        };
      });

      await onSubmit({
        description,
        amount: numericAmount,
        category,
        paidBy,
        date,
        splits: finalSplits,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit expense';
      setErrors((prev) => ({ ...prev, api: message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full pb-8">
      {/* Dynamic Big Amount Display Input */}
      <div className="flex flex-col items-center justify-center py-6 bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] mb-1">
          Amount
        </span>
        <div className="flex items-center justify-center max-w-full">
          <span className="text-4xl font-['Syne'] font-extrabold text-[#aa3000] mr-1">₹</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setAmount(val);
              }
            }}
            className="text-4xl font-['Syne'] font-extrabold text-[#1c1b1b] bg-transparent outline-none border-none text-center max-w-[200px] placeholder:text-[#5d5c74]/30"
          />
        </div>
        {errors.amount && (
          <span className="text-xs text-[#ba1a1a] font-bold font-['Space_Grotesk'] mt-2">
            {errors.amount}
          </span>
        )}
      </div>

      {/* Description & Date */}
      <div className="flex flex-col gap-4">
        <Input
          label="Description"
          placeholder="What was this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          icon="description"
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          icon="calendar_today"
        />
      </div>

      {/* Categories Chips Selection */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
          Category
        </span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 border-2 border-[#1c1b1b] rounded-full font-bold text-sm',
                  'transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
                  isSelected
                    ? 'bg-[#ffdbd0] text-[#aa3000] border-[#aa3000] translate-x-[-1px] translate-y-[-1px] shadow-[3px_3px_0px_0px_rgba(170,48,0,1)]'
                    : 'bg-[#fcf9f8] text-[#1c1b1b] hover:bg-[#eae7e7] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
                ].join(' ')}
              >
                <span>{cat.emoji}</span>
                <span className="font-['Space_Grotesk']">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paid By Selector */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
          Paid By
        </span>
        <div className="relative border-2 border-[#1c1b1b] rounded-lg shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] bg-[#fcf9f8] overflow-hidden">
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-transparent font-bold text-[#1c1b1b] font-['Space_Grotesk'] outline-none appearance-none cursor-pointer"
          >
            {members.map((member) => (
              <option key={member.userId._id} value={member.userId._id}>
                {member.userId.name} {member.userId._id === members[0]?.userId._id ? '(You)' : ''}
              </option>
            ))}
          </select>
          <span className="absolute left-3 top-3 material-symbols-outlined text-[#5d5c74]">
            person_filled
          </span>
          <span className="absolute right-3 top-3 material-symbols-outlined text-[#5d5c74] pointer-events-none">
            arrow_drop_down
          </span>
        </div>
        {errors.paidBy && <span className="text-xs text-[#ba1a1a] font-bold font-['Space_Grotesk']">{errors.paidBy}</span>}
      </div>

      {/* Split Type Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
            Split Strategy
          </span>
        </div>
        <SplitTypeSelector value={splitType} onChange={setSplitType} />
      </div>

      {/* Split Details & Members Checklist */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
          Split Distribution
        </span>

        <Card className="flex flex-col gap-4">
          {members.map((member) => {
            const mId = member.userId._id;
            const isIncluded = splitType === 'equal' ? includedMembers[mId] : true;
            
            // Calculate dynamic share preview
            let shareVal = 0;
            if (splitType === 'equal') {
              shareVal = isIncluded ? equalShareValue : 0;
            } else if (splitType === 'exact') {
              shareVal = parseFloat(customSplits[mId] || '0') || 0;
            } else if (splitType === 'percentage') {
              const pct = parseFloat(customSplits[mId] || '0') || 0;
              shareVal = (pct / 100) * numericAmount;
            }

            return (
              <div
                key={mId}
                className={[
                  'flex items-center justify-between pb-3 border-b border-[#eae7e7] last:border-b-0 last:pb-0',
                  !isIncluded ? 'opacity-40' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  {splitType === 'equal' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleInclude(mId)}
                      className={[
                        'w-6 h-6 border-2 border-[#1c1b1b] rounded flex items-center justify-center cursor-pointer',
                        isIncluded ? 'bg-[#aa3000]' : 'bg-transparent',
                      ].join(' ')}
                    >
                      {isIncluded && (
                        <span className="material-symbols-outlined text-white text-[18px]">
                          check
                        </span>
                      )}
                    </button>
                  ) : (
                    <div className="w-2" />
                  )}

                  <Avatar
                    name={member.userId.name}
                    src={member.userId.avatarUrl}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#1c1b1b]">
                      {member.userId.name}
                    </span>
                    {splitType === 'percentage' && isIncluded && (
                      <span className="text-xs text-[#5d5c74] font-semibold">
                        {customSplits[mId] ? `${customSplits[mId]}%` : '0%'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {splitType === 'equal' && (
                    <span className="font-['Syne'] font-extrabold text-[#1c1b1b]">
                      ₹{shareVal.toFixed(2)}
                    </span>
                  )}

                  {splitType === 'exact' && (
                    <div className="flex items-center bg-[#fcf9f8] border-2 border-[#1c1b1b] rounded-lg px-2 py-1 w-28">
                      <span className="text-xs font-bold text-[#5d5c74] mr-1">₹</span>
                      <input
                        type="text"
                        placeholder="0.0"
                        value={customSplits[mId] || ''}
                        onChange={(e) => handleCustomSplitChange(mId, e.target.value)}
                        className="w-full text-right outline-none bg-transparent font-bold text-sm"
                      />
                    </div>
                  )}

                  {splitType === 'percentage' && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center bg-[#fcf9f8] border-2 border-[#1c1b1b] rounded-lg px-2 py-1 w-20">
                        <input
                          type="text"
                          placeholder="0"
                          value={customSplits[mId] || ''}
                          onChange={(e) => handleCustomSplitChange(mId, e.target.value)}
                          className="w-full text-right outline-none bg-transparent font-bold text-sm mr-1"
                        />
                        <span className="text-xs font-bold text-[#5d5c74]">%</span>
                      </div>
                      <span className="text-xs text-[#5d5c74] font-semibold">
                        ₹{shareVal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
        {errors.splits && (
          <span className="text-xs text-[#ba1a1a] font-bold font-['Space_Grotesk'] mt-1">
            {errors.splits}
          </span>
        )}
      </div>

      {errors.api && (
        <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] text-[#ba1a1a] p-3 rounded-lg font-bold font-['Space_Grotesk'] text-sm">
          {errors.api}
        </div>
      )}

      {/* Submit Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading}
        icon={initialData ? 'save' : 'add'}
      >
        {initialData ? 'Save Expense' : `Add Expense (₹${numericAmount.toFixed(2)})`}
      </Button>
    </form>
  );
}

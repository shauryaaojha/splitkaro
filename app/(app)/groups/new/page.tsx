'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const EMOJIS = ['👥', '🍔', '✈️', '🏠', '🎮', '🍻', '🛍️', '🍿', '🚗', '💡'];

const CATEGORIES = [
  { id: 'food', label: 'Food', emoji: '🍔' },
  { id: 'trip', label: 'Trip', emoji: '✈️' },
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'fun', label: 'Fun', emoji: '🎮' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export default function NewGroupPage() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [emoji, setEmoji] = useState('👥');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, emoji }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create group');
      }

      const createdGroup = json.data;
      router.push(`/groups/${createdGroup._id}/invite`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-16">
      {/* TopBar with back navigation */}
      <TopBar title="New Group" showBack />

      {/* Header title */}
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
          Create Ledger
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] leading-tight">
          Create a Group
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Name input */}
        <Input
          label="Group Name"
          placeholder="e.g. Goa Trip, Flat 402, Dinners"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error || undefined}
          icon="group"
        />

        {/* Emoji selection grid */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037]">
            Group Avatar Emoji
          </span>
          <div className="grid grid-cols-5 gap-3 bg-white border-2 border-[#1c1b1b] rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
            {EMOJIS.map((e) => {
              const isSelected = emoji === e;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={[
                    'w-10 h-10 flex items-center justify-center text-xl border-2 rounded-xl transition-all cursor-pointer',
                    isSelected
                      ? 'bg-[#ffdbd0] border-[#aa3000] shadow-[2px_2px_0px_0px_rgba(170,48,0,1)]'
                      : 'bg-[#fcf9f8] border-[#1c1b1b] hover:bg-[#eae7e7]',
                  ].join(' ')}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories Chips */}
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

        {/* Submit button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading || !name.trim()}
          icon="check"
        >
          Create Group
        </Button>
      </form>
    </div>
  );
}

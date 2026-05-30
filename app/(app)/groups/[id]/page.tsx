'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import TopBar from '@/components/layout/TopBar';
import ExpenseItem from '@/components/expenses/ExpenseItem';
import BalanceMatrix from '@/components/groups/BalanceMatrix';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useGroup } from '@/hooks/useGroup';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'expenses' | 'balances' | 'settle';

interface SimplifiedTransaction {
  from: {
    _id: string;
    name: string;
    email: string;
    upiId: string;
    avatarUrl?: string;
  };
  to: {
    _id: string;
    name: string;
    email: string;
    upiId: string;
    avatarUrl?: string;
  };
  amount: number;
}

const settleFetcher = async (url: string): Promise<SimplifiedTransaction[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to load settlements');
  }
  const json = await res.json();
  return json.data.transactions;
};

const categoryEmojis: Record<string, string> = {
  food: '🍔',
  trip: '✈️',
  home: '🏠',
  fun: '🎮',
  other: '📦',
};

export default function GroupDetailPage() {
  const { id: groupId } = useParams() as { id: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');

  const { user } = useAuth();
  const { group, isLoading: loadingGroup, error: groupError } = useGroup(groupId);
  const { expenses, isLoading: loadingExpenses, error: expensesError } = useExpenses(groupId);

  // Fetch group simplified debts
  const { data: transactions, isLoading: loadingSettle } = useSWR<SimplifiedTransaction[]>(
    groupId && activeTab === 'settle' ? `/api/groups/${groupId}/settle` : null,
    settleFetcher,
    { revalidateOnFocus: true }
  );

  // Fetch group balance matrix
  const { data: balanceMatrix, isLoading: loadingBalances } = useSWR(
    groupId && activeTab === 'balances' ? `/api/groups/${groupId}/balances` : null,
    async (url) => {
      const res = await fetch(url);
      const json = await res.json();
      return json.data;
    },
    { revalidateOnFocus: true }
  );

  if (loadingGroup) {
    return (
      <div className="flex flex-col gap-6 pt-16 min-h-screen">
        <TopBar showBack />
        <Skeleton className="w-full h-40 rounded-2xl border-2 border-[#1c1b1b]" />
        <Skeleton className="w-full h-12 rounded-full border-2 border-[#1c1b1b]" />
        <Skeleton className="w-full h-64 rounded-2xl border-2 border-[#1c1b1b]" />
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="flex flex-col gap-6 pt-16 min-h-screen">
        <TopBar showBack />
        <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] text-[#ba1a1a] p-4 rounded-2xl font-bold font-['Space_Grotesk'] text-sm text-center">
          Group not found or you are not authorized to view it.
        </div>
      </div>
    );
  }

  // Calculate my net balance in group
  const myMemberId = user?._id.toString();
  const myTransactionList = transactions || [];
  
  let myNetOwedText = "All settled up";
  let myNetOwedColor = "bg-[#eae7e7] text-[#1c1b1b]";
  let myNetOwedIcon = "done_all";

  // Calculate how much I owe or am owed from transactions
  let myOwedSum = 0;
  myTransactionList.forEach(t => {
    if (t.from._id === myMemberId) {
      myOwedSum -= t.amount;
    } else if (t.to._id === myMemberId) {
      myOwedSum += t.amount;
    }
  });

  if (myOwedSum > 0) {
    myNetOwedText = `You are owed ₹${myOwedSum.toFixed(2)}`;
    myNetOwedColor = "bg-[#E8F8EE] text-[#1b6d30]";
    myNetOwedIcon = "trending_up";
  } else if (myOwedSum < 0) {
    myNetOwedText = `You owe ₹${Math.abs(myOwedSum).toFixed(2)}`;
    myNetOwedColor = "bg-[#ffdad6] text-[#ba1a1a]";
    myNetOwedIcon = "warning";
  }

  return (
    <div className="flex flex-col gap-6 pt-16 min-h-screen relative">
      {/* TopBar with group info */}
      <TopBar
        title={group.name}
        showBack
        rightAction={
          <Link href={`/groups/${groupId}/invite`}>
            <Button variant="ghost" size="sm" icon="person_add">
              Invite
            </Button>
          </Link>
        }
      />

      {/* Hero Display Card */}
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden text-center">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#ffdbd0]/50 rounded-full opacity-40 blur-xl"></div>
        <div className="text-[64px] leading-none mb-3 filter drop-shadow-[1px_1px_0px_rgba(26,26,26,1)]">
          {group.emoji || '👥'}
        </div>
        
        {/* Settlement Stamp Badge */}
        <div className={[
          'inline-flex items-center gap-1 mt-1 border-2 border-[#1c1b1b] rounded-full px-3 py-1 font-bold font-["Space_Grotesk"] text-xs shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transform -rotate-1',
          myNetOwedColor,
        ].join(' ')}>
          <span className="material-symbols-outlined text-[16px]">{myNetOwedIcon}</span>
          {myNetOwedText}
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {([
          { id: 'expenses', label: 'Expenses', icon: 'receipt_long' },
          { id: 'balances', label: 'Balances', icon: 'account_balance' },
          { id: 'settle', label: 'Settle Up', icon: 'handshake' },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'whitespace-nowrap flex items-center gap-1.5 px-4 py-2 border-2 border-[#1c1b1b] rounded-full font-bold text-xs',
                'transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
                isActive
                  ? 'bg-[#aa3000] text-white translate-x-[-1px] translate-y-[-1px] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                  : 'bg-white text-[#1c1b1b] hover:bg-[#eae7e7] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span className="font-['Space_Grotesk'] uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="flex-1 pb-16">
        {activeTab === 'expenses' && (
          <div className="flex flex-col gap-4">
            {loadingExpenses ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="w-full h-16 rounded-xl border-2 border-[#1c1b1b]" />
                <Skeleton className="w-full h-16 rounded-xl border-2 border-[#1c1b1b]" />
              </div>
            ) : expensesError ? (
              <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] text-[#ba1a1a] p-4 rounded-xl font-bold font-['Space_Grotesk'] text-xs text-center">
                Failed to load expenses.
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-center text-[#5d5c74]">
                <span className="material-symbols-outlined text-4xl mb-3 text-[#5d5c74]/50">
                  receipt_long
                </span>
                <span className="text-sm font-bold font-['Space_Grotesk'] text-[#1c1b1b]">
                  No expenses recorded
                </span>
                <span className="text-xs text-[#5d5c74]/70 mt-1 max-w-[200px]">
                  Click the plus icon below to record the group&apos;s first shared expense!
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {expenses.map((expense) => {
                  const paidBy =
                    typeof expense.paidBy === 'string'
                      ? { _id: expense.paidBy, name: expense.paidByName || 'Unknown' }
                      : expense.paidBy;
                  const creatorSplit = expense.splits.find(s => s.userId === myMemberId);
                  const isPaidByMe = paidBy._id === myMemberId;
                  
                  return (
                    <ExpenseItem
                      key={expense._id}
                      expense={{
                        id: expense._id,
                        description: expense.description,
                        amount: expense.amount,
                        category: expense.category,
                        categoryEmoji: categoryEmojis[expense.category] || '📦',
                        paidBy: isPaidByMe ? 'You' : paidBy.name || 'Unknown',
                        date: expense.date,
                        myShare: creatorSplit ? creatorSplit.share : undefined,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="flex flex-col gap-4">
            {loadingBalances ? (
              <Skeleton className="w-full h-64 rounded-2xl border-2 border-[#1c1b1b]" />
            ) : balanceMatrix ? (
              <BalanceMatrix balances={balanceMatrix} />
            ) : null}
          </div>
        )}

        {activeTab === 'settle' && (
          <div className="flex flex-col gap-4">
            {loadingSettle ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="w-full h-16 rounded-xl border-2 border-[#1c1b1b]" />
                <Skeleton className="w-full h-16 rounded-xl border-2 border-[#1c1b1b]" />
              </div>
            ) : myTransactionList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border-2 border-[#1c1b1b] rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-center text-[#5d5c74]">
                <span className="material-symbols-outlined text-4xl mb-3 text-[#1b6d30]">
                  done_all
                </span>
                <span className="text-sm font-bold font-['Space_Grotesk'] text-[#1c1b1b]">
                  Everyone is settled!
                </span>
                <span className="text-xs text-[#5d5c74]/70 mt-1 max-w-[200px]">
                  All net debts inside this group are completely settled!
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5c4037] px-1">
                  Simplified Settlement Path
                </span>
                {myTransactionList.map((t, idx) => {
                  const isOwedByMe = t.from._id === myMemberId;
                  const isOwedToMe = t.to._id === myMemberId;

                  return (
                    <Card
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white border-2 border-[#1c1b1b]"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={t.from.name} src={t.from.avatarUrl} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#5d5c74] font-['Space_Grotesk'] uppercase tracking-wider">
                            {t.from.name} owes
                          </span>
                          <span className="text-base font-bold font-['DM_Sans'] text-[#1c1b1b]">
                            {t.to.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-['Syne'] font-extrabold text-[#aa3000]">
                          ₹{t.amount.toFixed(2)}
                        </span>
                        
                        {/* Custom Settle action button */}
                        {isOwedByMe && (
                          <button
                            type="button"
                            onClick={() => {
                              router.push(
                                `/groups/${groupId}/settle?payerId=${t.from._id}&payeeId=${t.to._id}&amount=${t.amount}`
                              );
                            }}
                            className="bg-[#ffdbd0] border border-[#1c1b1b] rounded-full px-3 py-1 font-bold text-[10px] uppercase font-['Space_Grotesk'] shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] hover:bg-[#ffdbd0]/80 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                          >
                            Settle Up
                          </button>
                        )}
                        {isOwedToMe && (
                          <span className="bg-[#E8F8EE] border border-[#1c1b1b] rounded-full px-3 py-1 font-bold text-[10px] uppercase font-['Space_Grotesk']">
                            Awaiting payment
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB to add a new expense (only visible in Expenses tab) */}
      {activeTab === 'expenses' && (
        <Link
          href={`/groups/${groupId}/expense/new`}
          className="fixed bottom-28 right-6 z-40 md:hidden"
        >
          <button
            type="button"
            className="w-14 h-14 bg-[#aa3000] text-white rounded-full border-2 border-[#1c1b1b] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#c45a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center cursor-pointer font-bold"
            title="Add Expense"
          >
            <span className="material-symbols-outlined text-[28px] font-extrabold">
              add
            </span>
          </button>
        </Link>
      )}
    </div>
  );
}

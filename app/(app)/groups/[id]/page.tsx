'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import TopBar from '@/components/layout/TopBar';
import ExpenseItem from '@/components/expenses/ExpenseItem';
import BalanceMatrix from '@/components/groups/BalanceMatrix';
import MemberProfileSheet from '@/components/groups/MemberProfileSheet';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useGroup } from '@/hooks/useGroup';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

type Tab = 'expenses' | 'balances' | 'settle' | 'members';

interface SimplifiedTransaction {
  from: { _id: string; name: string; email: string; upiId: string; avatarUrl?: string };
  to: { _id: string; name: string; email: string; upiId: string; avatarUrl?: string };
  amount: number;
}

const settleFetcher = async (url: string): Promise<SimplifiedTransaction[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load settlements');
  const json = await res.json();
  return json.data.transactions;
};

const categoryEmojis: Record<string, string> = {
  food: '🍔', trip: '✈️', home: '🏠', fun: '🎮', other: '📦',
};

type PopulatedMember = {
  userId: { _id: string; name: string; email: string; upiId?: string; avatarUrl?: string };
  role: 'admin' | 'member';
  joinedAt: string;
  name?: string;
  email?: string;
  upiId?: string;
  avatarUrl?: string;
};

export default function GroupDetailPage() {
  const { id: groupId } = useParams() as { id: string };
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [selectedMember, setSelectedMember] = useState<PopulatedMember | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { user } = useAuth();
  const { group, isLoading: loadingGroup, error: groupError, mutate: mutateGroup } = useGroup(groupId);
  const { expenses, isLoading: loadingExpenses, error: expensesError, mutate: mutateExpenses } = useExpenses(groupId);

  const { data: transactions, isLoading: loadingSettle } = useSWR<SimplifiedTransaction[]>(
    groupId && activeTab === 'settle' ? `/api/groups/${groupId}/settle` : null,
    settleFetcher,
    { revalidateOnFocus: true }
  );

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
      <div className="flex flex-col gap-6 pt-16 min-h-screen" style={{ background: 'var(--t-surface)' }}>
        <TopBar showBack />
        <Skeleton className="w-full h-40 rounded-2xl" />
        <Skeleton className="w-full h-12 rounded-full" />
        <Skeleton className="w-full h-64 rounded-2xl" />
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="flex flex-col gap-6 pt-16 min-h-screen" style={{ background: 'var(--t-surface)' }}>
        <TopBar showBack />
        <div className="p-4 rounded-2xl font-bold font-['Space_Grotesk'] text-sm text-center" style={{ border: '2px solid var(--t-danger)', background: 'var(--t-danger-bg)', color: 'var(--t-danger)' }}>
          Group not found or you are not authorized to view it.
        </div>
      </div>
    );
  }

  const myMemberId = user?._id.toString();
  const myTransactionList = transactions || [];

  // Calculate my balance in group for badge
  let myOwedSum = 0;
  myTransactionList.forEach(t => {
    if (t.from._id === myMemberId) myOwedSum -= t.amount;
    else if (t.to._id === myMemberId) myOwedSum += t.amount;
  });

  let myNetOwedText = 'All settled up';
  let myNetOwedStyle = { background: 'var(--t-surface-3)', color: 'var(--t-on-surface)' };
  let myNetOwedIcon = 'done_all';

  if (myOwedSum > 0) {
    myNetOwedText = `You are owed ₹${myOwedSum.toFixed(2)}`;
    myNetOwedStyle = { background: 'var(--t-success-bg)', color: 'var(--t-success)' };
    myNetOwedIcon = 'trending_up';
  } else if (myOwedSum < 0) {
    myNetOwedText = `You owe ₹${Math.abs(myOwedSum).toFixed(2)}`;
    myNetOwedStyle = { background: 'var(--t-danger-bg)', color: 'var(--t-danger)' };
    myNetOwedIcon = 'warning';
  }

  // Get populated members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const populatedMembers: PopulatedMember[] = (group.members || []).map((m: any) => m as PopulatedMember);
  const myMember = populatedMembers.find(m => {
    const uid = typeof m.userId === 'string' ? m.userId : m.userId?._id;
    return uid?.toString() === myMemberId;
  });
  const isAdmin = myMember?.role === 'admin';
  const memberCount = populatedMembers.length;

  const handleLeaveGroup = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to leave group');
      toast.success('You have left the group');
      router.replace('/groups');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setActionLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleTransferAdmin = async () => {
    if (!selectedNewAdmin) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/transfer-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAdminId: selectedNewAdmin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to transfer ownership');
      toast.success('Ownership transferred!');
      await mutateGroup();
      setShowTransferDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to transfer ownership');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      toast.success('Expense deleted');
      mutateExpenses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const tabs = [
    { id: 'expenses' as Tab, label: 'Expenses', icon: 'receipt_long' },
    { id: 'balances' as Tab, label: 'Balances', icon: 'account_balance' },
    { id: 'settle' as Tab, label: 'Settle Up', icon: 'handshake' },
    { id: 'members' as Tab, label: `Members (${memberCount})`, icon: 'group' },
  ];

  return (
    <div className="flex flex-col gap-6 pt-16 min-h-screen relative" style={{ background: 'var(--t-surface)' }}>
      {/* TopBar */}
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
      <div
        className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl relative overflow-hidden text-center"
        style={{
          background: 'var(--t-card-bg)',
          border: '2px solid var(--t-border)',
          boxShadow: '2px 2px 0px 0px var(--t-shadow)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-xl pointer-events-none" style={{ background: 'var(--t-primary)' }} />
        <div className="text-[64px] leading-none mb-3 filter drop-shadow-sm">
          {group.emoji || '👥'}
        </div>
        <div
          className="inline-flex items-center gap-1 mt-1 rounded-full px-3 py-1 font-bold font-['Space_Grotesk'] text-xs transform -rotate-1"
          style={{
            border: '2px solid var(--t-border)',
            boxShadow: '2px 2px 0px 0px var(--t-shadow)',
            ...myNetOwedStyle,
          }}
        >
          <span className="material-symbols-outlined text-[16px]">{myNetOwedIcon}</span>
          {myNetOwedText}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all duration-150 cursor-pointer"
              style={{
                border: '2px solid var(--t-border)',
                boxShadow: isActive ? '3px 3px 0px 0px var(--t-shadow)' : '2px 2px 0px 0px var(--t-shadow)',
                background: isActive ? 'var(--t-primary)' : 'var(--t-card-bg)',
                color: isActive ? '#fff' : 'var(--t-on-surface)',
                transform: isActive ? 'translate(-1px, -1px)' : undefined,
              }}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span className="font-['Space_Grotesk'] uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 pb-16">
        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="flex flex-col gap-4">
            {loadingExpenses ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="w-full h-16 rounded-xl" />
                <Skeleton className="w-full h-16 rounded-xl" />
              </div>
            ) : expensesError ? (
              <div className="p-4 rounded-xl font-bold font-['Space_Grotesk'] text-xs text-center" style={{ border: '2px solid var(--t-danger)', background: 'var(--t-danger-bg)', color: 'var(--t-danger)' }}>
                Failed to load expenses.
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl text-center" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)', color: 'var(--t-on-surface-muted)' }}>
                <span className="material-symbols-outlined text-4xl mb-3" style={{ opacity: 0.4 }}>receipt_long</span>
                <span className="text-sm font-bold font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface)' }}>No expenses recorded</span>
                <span className="text-xs mt-1 max-w-[200px]" style={{ opacity: 0.7 }}>Click the + icon to record the group&apos;s first shared expense!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {expenses.map((expense) => {
                  const paidBy = typeof expense.paidBy === 'string'
                    ? { _id: expense.paidBy, name: expense.paidByName || 'Unknown' }
                    : expense.paidBy;
                  const creatorSplit = expense.splits.find((s: { userId: string }) => s.userId === myMemberId);
                  const isPaidByMe = paidBy._id === myMemberId;
                  const isMyExpense = expense.createdBy === myMemberId;

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
                      isEditable={isAdmin || isMyExpense}
                      isDeletable={isAdmin || isMyExpense}
                      onEdit={() => router.push(`/groups/${groupId}/expense/${expense._id}`)}
                      onDelete={() => handleDeleteExpense(expense._id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Balances Tab */}
        {activeTab === 'balances' && (
          <div className="flex flex-col gap-4">
            {loadingBalances ? (
              <Skeleton className="w-full h-64 rounded-2xl" />
            ) : balanceMatrix ? (
              <BalanceMatrix balances={balanceMatrix} />
            ) : null}
          </div>
        )}

        {/* Settle Tab */}
        {activeTab === 'settle' && (
          <div className="flex flex-col gap-4">
            {loadingSettle ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="w-full h-16 rounded-xl" />
                <Skeleton className="w-full h-16 rounded-xl" />
              </div>
            ) : myTransactionList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl text-center" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)', color: 'var(--t-on-surface-muted)' }}>
                <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--t-success)' }}>done_all</span>
                <span className="text-sm font-bold font-['Space_Grotesk']" style={{ color: 'var(--t-on-surface)' }}>Everyone is settled!</span>
                <span className="text-xs mt-1 max-w-[200px]" style={{ opacity: 0.7 }}>All net debts are completely settled!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] px-1" style={{ color: 'var(--t-on-surface-muted)' }}>
                  Simplified Settlement Path
                </span>
                {myTransactionList.map((t, idx) => {
                  const isOwedByMe = t.from._id === myMemberId;
                  const isOwedToMe = t.to._id === myMemberId;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-2xl"
                      style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '2px 2px 0px 0px var(--t-shadow)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={t.from.name} src={t.from.avatarUrl} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold font-['Space_Grotesk'] uppercase tracking-wider" style={{ color: 'var(--t-on-surface-muted)' }}>
                            {t.from.name} owes
                          </span>
                          <span className="text-base font-bold font-['DM_Sans']" style={{ color: 'var(--t-on-surface)' }}>
                            {t.to.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-['Syne'] font-extrabold" style={{ color: 'var(--t-primary)' }}>
                          ₹{t.amount.toFixed(2)}
                        </span>
                        {isOwedByMe && (
                          <button
                            type="button"
                            onClick={() => router.push(`/groups/${groupId}/settle?payerId=${t.from._id}&payeeId=${t.to._id}&amount=${t.amount}`)}
                            className="rounded-full px-3 py-1 font-bold text-[10px] uppercase font-['Space_Grotesk'] cursor-pointer"
                            style={{ background: 'var(--t-danger-bg)', color: 'var(--t-danger)', border: '1px solid var(--t-border)' }}
                          >
                            Settle Up
                          </button>
                        )}
                        {isOwedToMe && (
                          <span className="rounded-full px-3 py-1 font-bold text-[10px] uppercase font-['Space_Grotesk']" style={{ background: 'var(--t-success-bg)', color: 'var(--t-success)', border: '1px solid var(--t-success)' }}>
                            Awaiting payment
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="flex flex-col gap-4">
            {/* Members List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] px-1" style={{ color: 'var(--t-on-surface-muted)' }}>
                {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
              </span>
              <div className="flex flex-col gap-2">
                {populatedMembers.map((member, idx) => {
                  const memberId = typeof member.userId === 'string' ? member.userId : member.userId?._id;
                  const memberName = typeof member.userId === 'object' ? member.userId.name : member.name || 'Member';
                  const memberEmail = typeof member.userId === 'object' ? member.userId.email : member.email || '';
                  const memberAvatar = typeof member.userId === 'object' ? member.userId.avatarUrl : member.avatarUrl;
                  const isMe = memberId?.toString() === myMemberId;
                  const isThisAdmin = member.role === 'admin';

                  // Calculate their balance from settle transactions
                  let theirBalance = 0;
                  myTransactionList.forEach(t => {
                    if (t.from._id === memberId?.toString()) theirBalance -= t.amount;
                    else if (t.to._id === memberId?.toString()) theirBalance += t.amount;
                  });

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !isMe && setSelectedMember(member)}
                      className="flex items-center gap-3 p-4 rounded-xl text-left w-full cursor-pointer active:scale-[0.99] transition-transform"
                      style={{
                        background: 'var(--t-card-bg)',
                        border: '2px solid var(--t-border)',
                        boxShadow: '2px 2px 0px 0px var(--t-shadow)',
                      }}
                    >
                      <Avatar name={memberName} src={memberAvatar} size="sm" />
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm font-['DM_Sans'] truncate" style={{ color: 'var(--t-on-surface)' }}>
                            {memberName}
                          </span>
                          {isMe && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background: 'var(--t-primary)', color: '#fff' }}>You</span>}
                          {isThisAdmin && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background: 'var(--t-accent-container)', color: 'var(--t-accent)' }}>Admin</span>}
                        </div>
                        <span className="text-xs truncate" style={{ color: 'var(--t-on-surface-muted)' }}>{memberEmail}</span>
                      </div>
                      {!isMe && (
                        <div className="flex flex-col items-end shrink-0">
                          {theirBalance > 0 ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--t-success-bg)', color: 'var(--t-success)' }}>
                              owes you ₹{theirBalance.toFixed(0)}
                            </span>
                          ) : theirBalance < 0 ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--t-danger-bg)', color: 'var(--t-danger)' }}>
                              you owe ₹{Math.abs(theirBalance).toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--t-surface-3)', color: 'var(--t-on-surface-muted)' }}>settled</span>
                          )}
                          <span className="material-symbols-outlined text-[18px] mt-1" style={{ color: 'var(--t-on-surface-muted)' }}>chevron_right</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions: Leave Group */}
            <div className="flex flex-col gap-3 mt-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowTransferDialog(true)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer transition-all"
                  style={{
                    background: 'var(--t-accent-container)',
                    color: 'var(--t-accent)',
                    border: '2px solid var(--t-border)',
                    boxShadow: '2px 2px 0px 0px var(--t-shadow)',
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  Transfer Admin Ownership
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(true)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer transition-all"
                style={{
                  background: 'var(--t-danger-bg)',
                  color: 'var(--t-danger)',
                  border: '2px solid var(--t-border)',
                  boxShadow: '2px 2px 0px 0px var(--t-shadow)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">exit_to_app</span>
                Leave Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB: Add Expense */}
      {activeTab === 'expenses' && (
        <Link href={`/groups/${groupId}/expense/new`} className="fixed bottom-28 right-6 z-40 md:hidden">
          <button
            type="button"
            className="w-14 h-14 text-white rounded-full flex items-center justify-center cursor-pointer font-bold transition-all active:scale-90"
            style={{
              background: 'var(--t-primary)',
              border: '2px solid var(--t-border)',
              boxShadow: '3px 3px 0px 0px var(--t-shadow)',
            }}
            title="Add Expense"
          >
            <span className="material-symbols-outlined text-[28px] font-extrabold">add</span>
          </button>
        </Link>
      )}

      {/* Leave Group Confirmation Dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[360px] rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '4px 4px 0px 0px var(--t-shadow)' }}>
            <h3 className="font-bold font-['Space_Grotesk'] text-lg" style={{ color: 'var(--t-on-surface)' }}>Leave Group?</h3>
            <p className="text-sm" style={{ color: 'var(--t-on-surface-muted)' }}>
              You must settle all balances before leaving. Are you sure?
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer"
                style={{ background: 'var(--t-surface-3)', color: 'var(--t-on-surface)', border: '2px solid var(--t-border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--t-danger)', color: '#fff', border: '2px solid var(--t-border)' }}
              >
                {actionLoading ? 'Leaving...' : 'Leave Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Admin Dialog */}
      {showTransferDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[400px] rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--t-card-bg)', border: '2px solid var(--t-border)', boxShadow: '4px 4px 0px 0px var(--t-shadow)' }}>
            <h3 className="font-bold font-['Space_Grotesk'] text-lg" style={{ color: 'var(--t-on-surface)' }}>Transfer Admin Ownership</h3>
            <p className="text-sm" style={{ color: 'var(--t-on-surface-muted)' }}>Select a member to become the new admin:</p>
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
              {populatedMembers
                .filter(m => {
                  const uid = typeof m.userId === 'string' ? m.userId : m.userId?._id;
                  return uid?.toString() !== myMemberId;
                })
                .map((m, idx) => {
                  const uid = typeof m.userId === 'string' ? m.userId : m.userId?._id;
                  const name = typeof m.userId === 'object' ? m.userId.name : m.name || 'Member';
                  const avatar = typeof m.userId === 'object' ? m.userId.avatarUrl : m.avatarUrl;
                  const selected = selectedNewAdmin === uid?.toString();
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedNewAdmin(uid?.toString() || '')}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                      style={{
                        background: selected ? 'var(--t-primary-container)' : 'var(--t-surface)',
                        border: `2px solid ${selected ? 'var(--t-primary)' : 'var(--t-border)'}`,
                      }}
                    >
                      <Avatar name={name} src={avatar} size="sm" />
                      <span className="font-bold text-sm font-['DM_Sans']" style={{ color: 'var(--t-on-surface)' }}>{name}</span>
                      {selected && <span className="material-symbols-outlined ml-auto text-[18px]" style={{ color: 'var(--t-primary)' }}>check_circle</span>}
                    </button>
                  );
                })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTransferDialog(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer"
                style={{ background: 'var(--t-surface-3)', color: 'var(--t-on-surface)', border: '2px solid var(--t-border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleTransferAdmin}
                disabled={!selectedNewAdmin || actionLoading}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm font-['Space_Grotesk'] cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--t-primary)', color: '#fff', border: '2px solid var(--t-border)' }}
              >
                {actionLoading ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Profile Sheet */}
      {selectedMember && (
        <MemberProfileSheet
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}

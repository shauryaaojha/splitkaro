'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import TopBar from '@/components/layout/TopBar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';

interface Friend {
  _id: string;
  name: string;
  email: string;
  upiId: string;
  avatarUrl?: string;
}

interface FriendRequest {
  from: Friend | string;
  status: 'pending' | 'accepted' | 'declined';
}

const friendsFetcher = async (url: string): Promise<Friend[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to load friends');
  }
  const json = await res.json();
  return json.data;
};

export default function FriendsPage() {
  const { user, mutate: mutateAuth } = useAuth();
  const toast = useToast();
  const [emailInput, setEmailInput] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const { data: friends, error: friendsError, isLoading: loadingFriends, mutate: mutateFriends } = useSWR<Friend[]>(
    '/api/friends',
    friendsFetcher,
    { revalidateOnFocus: true }
  );

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to send friend request');
      }

      toast.success(json.message || 'Friend request sent!');
      setEmailInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invite';
      setInviteError(message);
    } finally {
      setInviting(false);
    }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to respond to request');
      }

      toast.success(json.message || `Friend request ${action}ed`);
      
      // Mutate local state
      await mutateAuth();
      await mutateFriends();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to respond';
      toast.error(message);
    }
  };

  const pendingRequests = user?.friendRequests || [];

  return (
    <div className="flex flex-col gap-6 pt-16 min-h-screen">
      {/* Top Bar */}
      <TopBar title="Friends" />

      {/* Header Info */}
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-ink-muted">
          Directory
        </span>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-ink leading-tight">
          Manage Friends
        </h2>
        <p className="text-sm font-semibold text-ink-muted mt-0.5 leading-snug">
          Invite friends to split bills, settle up, and track ledgers.
        </p>
      </div>

      {/* Invite Friend Form */}
      <Card className="flex flex-col gap-3 bg-white border-2 border-ink">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-ink-muted">
          Add Friend by Email
        </span>
        <form onSubmit={handleSendInvite} className="flex flex-col gap-3">
          <Input
            placeholder="friend@email.com"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            error={inviteError || undefined}
            icon="mail"
          />
          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={inviting}
            disabled={inviting || !emailInput.trim()}
            icon="send"
          >
            Send Friend Request
          </Button>
        </form>
      </Card>

      {/* Pending Invitations list */}
      {pendingRequests.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-danger px-1">
            Pending Friend Requests ({pendingRequests.length})
          </span>
          <Card className="flex flex-col gap-4 bg-white border-2 border-ink">
            {(pendingRequests as FriendRequest[]).map((req) => {
              const requester = req.from;
              if (!requester || typeof requester === 'string') return null;
              return (
                <div
                  key={requester._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-soft last:border-b-0 last:pb-0 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={requester.name}
                      src={requester.avatarUrl}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-ink">
                        {requester.name}
                      </span>
                      <span className="text-xs text-ink-muted font-semibold">
                        {requester.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRespond(requester._id, 'decline')}
                      className="bg-transparent border-2 border-danger text-danger px-3.5 py-1.5 rounded-full font-bold text-xs uppercase font-['Space_Grotesk'] cursor-pointer hover:bg-[#ba1a1a]/5"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespond(requester._id, 'accept')}
                      className="bg-[#1b6d30] border-2 border-ink text-white px-3.5 py-1.5 rounded-full font-bold text-xs uppercase font-['Space_Grotesk'] cursor-pointer shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] hover:bg-[#1b6d30]/90 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Friends list */}
      <div className="flex flex-col gap-3 pb-8">
        <span className="text-xs font-bold uppercase tracking-wider font-['Space_Grotesk'] text-ink-muted px-1">
          Your Friends
        </span>

        <Card className="flex flex-col gap-4 bg-white border-2 border-ink">
          {loadingFriends ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="w-full h-10 rounded-lg" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
          ) : friendsError ? (
            <div className="text-xs text-danger font-bold font-['Space_Grotesk'] text-center">
              Failed to load friends.
            </div>
          ) : !friends || friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-ink-muted text-center">
              <span className="material-symbols-outlined text-4xl mb-2 text-ink-muted/50">
                person_off
              </span>
              <span className="text-sm font-bold font-['Space_Grotesk'] text-ink">
                No friends added yet
              </span>
              <span className="text-xs text-ink-muted/70 mt-1 max-w-[220px]">
                Add friends using the email input above to start sharing expenses!
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center justify-between pb-3 border-b border-soft last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={friend.name}
                      src={friend.avatarUrl}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-ink">
                        {friend.name}
                      </span>
                      <span className="text-xs text-ink-muted font-semibold">
                        {friend.email}
                      </span>
                    </div>
                  </div>
                  {friend.upiId && (
                    <span className="text-[10px] font-bold text-ink-muted font-['JetBrains_Mono'] border border-soft px-2 py-0.5 rounded bg-surface">
                      {friend.upiId}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

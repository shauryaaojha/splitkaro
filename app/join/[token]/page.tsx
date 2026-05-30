'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

interface GroupPreview {
  name: string;
  emoji: string;
  category: string;
  memberCount: number;
  creatorName: string;
}

const previewFetcher = async (url: string): Promise<GroupPreview> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load preview' }));
    throw new Error(err.error || 'Failed to load preview');
  }
  const json = await res.json();
  return json.data;
};

export default function JoinGroupPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const toast = useToast();
  const { user, isLoading: loadingAuth } = useAuth();
  const [joining, setJoining] = useState(false);

  const { data: preview, error, isLoading: loadingPreview } = useSWR<GroupPreview>(
    token ? `/api/groups/join/${token}` : null,
    previewFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/join/${token}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/groups/join/${token}`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to join group');
      }

      toast.success('Joined group successfully!');
      router.replace(`/groups/${json.data._id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join group';
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  const loading = loadingPreview || loadingAuth;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#F5F0E8] max-w-[600px] mx-auto w-full">
      {loading ? (
        <Card className="w-full max-w-[400px] flex flex-col items-center gap-4 bg-white border-2 border-[#1c1b1b]">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="w-48 h-6 rounded" />
          <Skeleton className="w-32 h-4 rounded" />
          <Skeleton className="w-full h-12 rounded-full mt-4" />
        </Card>
      ) : error ? (
        <Card className="w-full max-w-[400px] flex flex-col items-center gap-4 bg-white border-2 border-[#1c1b1b] text-center">
          <span className="material-symbols-outlined text-5xl text-[#ba1a1a]">
            error_outline
          </span>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[#1c1b1b]">
            Invite Expired
          </h2>
          <p className="text-xs text-[#5d5c74] font-semibold max-w-[260px]">
            {error.message || 'This invite link is invalid, expired, or the group has been archived.'}
          </p>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => router.push('/')}
            icon="home"
          >
            Go to SplitKaro
          </Button>
        </Card>
      ) : preview ? (
        <Card className="w-full max-w-[400px] flex flex-col items-center gap-5 bg-white border-2 border-[#1c1b1b] text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#ffdbd0]/50 rounded-full opacity-40 blur-xl pointer-events-none"></div>

          {/* Group Avatar */}
          <div className="text-[64px] leading-none mb-1 filter drop-shadow-[1px_1px_0px_rgba(26,26,26,1)]">
            {preview.emoji || '👥'}
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Grotesk'] text-[#5d5c74] mb-1">
              You&apos;ve Been Invited
            </span>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[#1c1b1b] leading-tight">
              Join &quot;{preview.name}&quot;
            </h2>
            <p className="text-xs text-[#5d5c74] font-semibold mt-1">
              Created by {preview.creatorName} · {preview.memberCount} members
            </p>
          </div>

          {/* Action button */}
          <div className="w-full mt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={joining}
              disabled={joining}
              onClick={handleJoin}
              icon={user ? 'group_add' : 'login'}
            >
              {user ? 'Join Group' : 'Sign in to Join'}
            </Button>
          </div>

          {!user && (
            <p className="text-[10px] text-[#5d5c74] font-semibold mt-1">
              You must have a SplitKaro account to join shared groups.
            </p>
          )}
        </Card>
      ) : null}
    </div>
  );
}

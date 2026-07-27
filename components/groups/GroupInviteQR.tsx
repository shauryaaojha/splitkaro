'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

interface GroupInviteQRProps {
  inviteToken: string;
  groupName: string;
}

export default function GroupInviteQR({ inviteToken, groupName }: GroupInviteQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const toast = useToast();

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${inviteToken}`
      : `/join/${inviteToken}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(inviteUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: '#1c1b1b',
        light: '#fcf9f8',
      },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [inviteUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  }, [inviteUrl, toast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on SplitKaro`,
          text: `You've been invited to join "${groupName}" on SplitKaro!`,
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled share - not an error
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      await handleCopyLink();
    }
  }, [groupName, inviteUrl, toast, handleCopyLink]);

  return (
    <Card className="flex flex-col items-center gap-4">
      <h3 className="font-bold font-['Space_Grotesk'] text-ink text-base">
        Invite to {groupName}
      </h3>

      {/* QR Code */}
      <div className="border-2 border-ink rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR code to join ${groupName}`}
            width={240}
            height={240}
          />
        ) : (
          <Skeleton variant="rectangular" className="w-[240px] h-[240px]" />
        )}
      </div>

      {/* Invite URL display */}
      <div className="w-full bg-surface border-2 border-ink rounded-lg px-3 py-2 text-xs font-['JetBrains_Mono'] text-ink-muted truncate text-center">
        {inviteUrl}
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <Button
          variant="ghost"
          size="sm"
          icon="content_copy"
          onClick={handleCopyLink}
          fullWidth
        >
          Copy Link
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon="share"
          onClick={handleShare}
          fullWidth
        >
          Share
        </Button>
      </div>
    </Card>
  );
}

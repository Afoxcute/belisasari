'use client';

import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/use-follow';
import { useFollowState } from '@/hooks/use-follow-state';
import { useUnfollow } from '@/hooks/use-unfollow';
import { UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  myProfileId: string | null;
  targetProfileId: string;
  onToggle?: (following: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function FollowButton({
  myProfileId,
  targetProfileId,
  onToggle,
  variant = 'outline',
  size = 'default',
  className,
}: FollowButtonProps) {
  const { isFollowing, loading: stateLoading } = useFollowState(myProfileId, targetProfileId);
  const { follow, loading: followLoading } = useFollow();
  const { unfollow, loading: unfollowLoading } = useUnfollow();
  const loading = stateLoading || followLoading || unfollowLoading;

  if (!myProfileId || myProfileId === targetProfileId) return null;

  const handleClick = async () => {
    if (!myProfileId) return;
    try {
      if (isFollowing) {
        await unfollow(myProfileId, targetProfileId);
        onToggle?.(false);
      } else {
        await follow(myProfileId, targetProfileId);
        onToggle?.(true);
      }
    } catch {
      // error state in hooks
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <span className="animate-pulse">...</span>
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" /> Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" /> Follow
        </>
      )}
    </Button>
  );
}

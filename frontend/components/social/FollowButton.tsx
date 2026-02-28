'use client';

import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/use-follow';
import { useFollowState } from '@/hooks/use-follow-state';
import { useUnfollow } from '@/hooks/use-unfollow';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

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
  className = '',
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

  // Custom styling for Stitch Aesthetic
  const getButtonStyles = () => {
    if (isFollowing) {
      return "bg-foreground/5 hover:bg-[#FF3B3B]/10 hover:border-[#FF3B3B]/30 border-border-light text-text-main hover:text-[#FF3B3B] group";
    }
    return "bg-[#00FF88]/10 hover:bg-[#00FF88]/20 border border-[#00FF88]/30 text-[#00FF88]";
  };

  return (
    <Button
      variant="outline"
      size={size}
      className={`${getButtonStyles()} ${className} border transition-all duration-200`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1.5 group-hover:text-[#FF3B3B] transition-colors" /> 
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1.5" /> 
          <span>Follow</span>
        </>
      )}
    </Button>
  );
}

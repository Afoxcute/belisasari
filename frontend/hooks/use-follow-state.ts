'use client';
import { useEffect, useState } from 'react';

export function useFollowState(startId: string | null, endId: string | null) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!startId || !endId) {
      setLoading(false);
      return;
    }
    let c = false;
    fetch(`/api/tapestry/follow-state?startId=${encodeURIComponent(startId)}&endId=${encodeURIComponent(endId)}`)
      .then((r) => r.json())
      .then((d) => { if (!c) setIsFollowing(!!d?.isFollowing); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [startId, endId]);
  return { isFollowing, loading };
}

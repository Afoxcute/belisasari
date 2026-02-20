'use client';

import type { IProfileList } from '@/lib/types/profile';
import { useEffect, useState } from 'react';

interface UseGetProfilesProps {
  walletAddress: string;
}

export function useGetProfiles({ walletAddress }: UseGetProfilesProps) {
  const [profiles, setProfiles] = useState<IProfileList[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      setProfiles(undefined);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = new URL('/api/tapestry/profiles', window.location.origin);
    url.searchParams.set('walletAddress', walletAddress);
    fetch(url.toString())
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || 'Failed to fetch profiles'); });
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setProfiles(data.profiles ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [walletAddress]);

  return { profiles, loading, error };
}

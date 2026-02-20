'use client';

import type { IIdentitiesResponse } from '@/lib/types/profile';
import { useCallback, useEffect, useState } from 'react';

interface UseGetIdentitiesProps {
  walletAddress: string;
}

export function useGetIdentities({ walletAddress }: UseGetIdentitiesProps) {
  const [data, setData] = useState<IIdentitiesResponse | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentities = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/identities?walletAddress=${encodeURIComponent(walletAddress)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch identities');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  return { data, loading, error, refetch: fetchIdentities };
}

'use client';

import { useState } from 'react';

export function useUnfollow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unfollow = async (startId: string, endId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tapestry/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startId, endId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unfollow failed');
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unfollow failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { unfollow, loading, error };
}

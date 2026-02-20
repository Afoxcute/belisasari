'use client';
import { useState } from 'react';

export function useFollow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const follow = async (startId: string, endId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tapestry/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startId, endId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };
  return { follow, loading, error };
}

'use client';

import { useEffect, useState } from 'react';

interface ProfileDetail {
  profile: { id: string; username: string; bio?: string | null; image?: string | null };
  socialCounts?: { followers: number; following: number };
}

export function useProfileDetail(profileId: string | null) {
  const [data, setData] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/tapestry/profiles/${profileId}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || 'Failed'); });
        return res.json();
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profileId]);

  return { data, loading, error };
}

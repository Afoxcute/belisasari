'use client';

import type { IActivityItem } from '@/lib/types/profile';
import { useEffect, useState } from 'react';

interface ActivityFeedResponse {
  activities: IActivityItem[];
  page: number;
  pageSize: number;
}

export function useActivityFeed(username: string | null, page = 1, pageSize = 20) {
  const [data, setData] = useState<ActivityFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ username, page: String(page), pageSize: String(pageSize) });
    fetch(`/api/tapestry/activity/feed?${params}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || 'Failed'); });
        return res.json();
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username, page, pageSize]);

  return { data, loading, error };
}

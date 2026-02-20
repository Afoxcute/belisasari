'use client';

import type { IContentItem } from '@/lib/types/profile';
import { useEffect, useState } from 'react';

interface UseContentsArgs {
  profileId?: string | null;
  requestingProfileId?: string | null;
  page?: number;
  pageSize?: number;
}

export function useContents({
  profileId,
  requestingProfileId,
  page = 1,
  pageSize = 20,
}: UseContentsArgs) {
  const [data, setData] = useState<{
    contents: IContentItem[];
    page: number;
    pageSize: number;
    totalCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (profileId) params.set('profileId', profileId);
    if (requestingProfileId) params.set('requestingProfileId', requestingProfileId);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    fetch(`/api/tapestry/contents?${params}`)
      .then((res) => res.ok ? res.json() : res.json().then((d) => { throw new Error(d.error || 'Failed'); }))
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profileId, requestingProfileId, page, pageSize]);

  return { data, loading, error };
}

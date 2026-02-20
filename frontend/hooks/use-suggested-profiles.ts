'use client';

import { useEffect, useState } from 'react';

interface SuggestedProfile {
  profile: { id: string; username: string; bio?: string | null; image?: string | null };
}

/** Suggested profiles to follow (keyed by namespace or first key in response) */
export function useSuggestedProfiles(identifier: string | null) {
  const [profiles, setProfiles] = useState<SuggestedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identifier) {
      setLoading(false);
      setProfiles([]);
      return;
    }
    let c = false;
    setLoading(true);
    fetch(`/api/tapestry/suggested?identifier=${encodeURIComponent(identifier)}`)
      .then((r) => r.json())
      .then((data) => {
        if (c) return;
        const list: SuggestedProfile[] = [];
        if (data && typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const entry = firstKey ? data[firstKey] : null;
          if (entry?.profile) list.push(entry);
          else if (Array.isArray(entry)) list.push(...entry);
        }
        setProfiles(list);
      })
      .catch(() => { if (!c) setProfiles([]); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [identifier]);

  return { profiles, loading };
}

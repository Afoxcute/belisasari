'use client';
import { useEffect, useState } from 'react';

interface Profile {
  id: string;
  username: string;
  bio?: string | null;
  image?: string | null;
}

export function useFollowing(profileId: string | null, page = 1, pageSize = 20) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      setProfiles([]);
      return;
    }
    let c = false;
    setLoading(true);
    fetch(`/api/tapestry/profiles/${profileId}/following?page=${page}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((d) => { if (!c) setProfiles(d?.profiles ?? []); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [profileId, page, pageSize]);
  return { profiles, loading };
}

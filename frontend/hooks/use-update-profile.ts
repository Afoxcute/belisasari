'use client';

import { useState } from 'react';

interface UpdateProfileArgs {
  profileId: string;
  username?: string;
  bio?: string;
  image?: string;
}

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async ({ profileId, username, bio, image }: UpdateProfileArgs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tapestry/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio, image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading, error };
}

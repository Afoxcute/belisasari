'use client';

import { useState } from 'react';

interface CreateProfileParams {
  walletAddress: string;
  username: string;
  bio?: string;
}

export function useCreateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = async ({ walletAddress, username, bio }: CreateProfileParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profiles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, username, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create profile');
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create profile';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createProfile, loading, error };
}

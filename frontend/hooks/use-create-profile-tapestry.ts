'use client';

import { useState } from 'react';

interface CreateProfileTapestryProps {
  username: string;
  walletAddress: string;
  bio?: string | null;
  image?: string | null;
}

export function useCreateProfileTapestry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>(null);

  const createProfile = async ({
    username,
    walletAddress,
    bio,
    image,
  }: CreateProfileTapestryProps) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('ownerWalletAddress', walletAddress);
      if (bio) formData.append('bio', bio);
      if (image) formData.append('image', image);

      const res = await fetch('/api/tapestry/profiles/create', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create profile');
      setResponse(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create profile';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createProfile, loading, error, response };
}

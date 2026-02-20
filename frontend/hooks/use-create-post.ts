'use client';

import { useState } from 'react';

interface CreatePostArgs {
  profileId: string;
  text: string;
  id?: string;
}

export function useCreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async ({ profileId, text, id }: CreatePostArgs) => {
    const contentId = id || `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tapestry/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contentId,
          profileId,
          properties: [{ key: 'body', value: text }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create post failed');
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Create post failed';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { createPost, loading, error };
}

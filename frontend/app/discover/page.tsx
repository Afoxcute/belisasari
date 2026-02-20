'use client';

import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/social/FollowButton';
import { useCurrentWallet } from '@/hooks/use-current-wallet';
import { useGetProfiles } from '@/hooks/use-get-profiles';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { User } from 'lucide-react';

interface SearchProfile {
  profile: { id: string; username: string; bio?: string | null; image?: string | null };
  socialCounts?: { followers: number; following: number };
}

export default function DiscoverPage() {
  const { ready, authenticated, login } = usePrivy();
  const { walletAddress } = useCurrentWallet();
  const { profiles } = useGetProfiles({ walletAddress: walletAddress || '' });
  const myProfileId = profiles?.[0]?.profile?.id ?? null;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tapestry/search/profiles?q=${encodeURIComponent(query.trim())}&pageSize=20`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.profiles ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-iris-primary/30 border-t-iris-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Discover</h1>
        <p className="text-muted-foreground mb-6">Log in to search and follow profiles.</p>
        <Button className="bg-iris-primary" onClick={() => login({ loginMethods: ['wallet'], walletChainType: 'solana-only' })}>
          Log in
        </Button>
        <p className="mt-4 text-sm"><Link href="/" className="underline">Back to home</Link></p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 tracking-tight text-iris-primary">Discover</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={loading}>{loading ? '...' : 'Search'}</Button>
      </form>

      <div className="space-y-3">
        {results.map((item) => (
          <div key={item.profile.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
            {item.profile.image ? (
              <Image src={item.profile.image} alt="" width={48} height={48} className="rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">@{item.profile.username}</p>
              {item.profile.bio && <p className="text-sm text-muted-foreground truncate">{item.profile.bio}</p>}
              {item.socialCounts && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.socialCounts.followers} followers · {item.socialCounts.following} following
                </p>
              )}
            </div>
            <FollowButton myProfileId={myProfileId} targetProfileId={item.profile.id} />
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/" className="underline">Back to home</Link> · <Link href="/feed" className="underline">Feed</Link>
      </p>
    </div>
  );
}

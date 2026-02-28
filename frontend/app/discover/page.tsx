'use client';

import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/social/FollowButton';
import { useAppAuth } from '@/components/provider/PrivyAppAuthContext';
import { useCurrentWallet } from '@/hooks/use-current-wallet';
import { useGetProfiles } from '@/hooks/use-get-profiles';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { User, Search, ArrowLeft, Loader2, Users } from 'lucide-react';

interface SearchProfile {
  profile: { id: string; username: string; bio?: string | null; image?: string | null };
  socialCounts?: { followers: number; following: number };
}

export default function DiscoverPage() {
  const { ready, authenticated, login } = useAppAuth();
  const { walletAddress } = useCurrentWallet();
  const { profiles } = useGetProfiles({ walletAddress: walletAddress || '' });
  const myProfileId = profiles?.[0]?.profile?.id ?? null;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
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
      <div className="min-h-screen bg-background-main flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background-main pt-20 px-4">
        <div className="container max-w-md mx-auto text-center bg-card-bg border border-border-light rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-[#00D4FF]" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-text-main">Discover</h1>
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            Log in to search for other users and communities on the network.
          </p>
          <Button
            className="w-full bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold h-12 text-[15px]"
            onClick={() => login({ loginMethods: ['wallet'], walletChainType: 'solana-only' })}
          >
            Connect Wallet
          </Button>
          <div className="mt-8 pt-6 border-t border-border-light">
            <Link href="/" className="text-[#6B7280] hover:text-text-main flex items-center justify-center gap-2 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main py-8 px-4 text-text-main">
      <div className="container max-w-[800px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">
              Discover
            </h1>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-foreground/5 border-border-light text-text-main hover:bg-foreground/10 h-9">
            <Link href="/feed">View Feed</Link>
          </Button>
        </div>

        {/* Search Bar Container */}
        <div className="rounded-2xl border border-border-light bg-card-bg p-6">
          <form onSubmit={handleSearch} className="flex gap-3 relative">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username..."
                className="w-full bg-foreground/5 border border-border-light rounded-xl pl-11 pr-4 h-12 text-[15px] focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] placeholder:text-[#6B7280] transition-all"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="h-12 px-8 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold rounded-xl whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </Button>
          </form>
        </div>

        {/* Results Container */}
        {hasSearched && (
          <div className="rounded-2xl border border-border-light bg-card-bg overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-[#6B7280]">
                <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin mb-4" />
                <p>Searching network...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-white/5">
                {results.map((item) => (
                  <div key={item.profile.id} className="p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="shrink-0 relative">
                      {item.profile.image ? (
                        <Image 
                          src={item.profile.image} 
                          alt={item.profile.username} 
                          width={52} 
                          height={52} 
                          className="rounded-full object-cover border-2 border-transparent group-hover:border-[#00D4FF]/30 transition-colors" 
                        />
                      ) : (
                        <div className="w-[52px] h-[52px] rounded-full bg-[#1A1A24] border border-border-light flex items-center justify-center">
                          <User className="h-6 w-6 text-[#6B7280]" />
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <Link href={`/profile`} className="block hover:underline decoration-[#00D4FF] decoration-2 underline-offset-2">
                        <p className="font-bold text-[16px] text-text-main tracking-tight">@{item.profile.username}</p>
                      </Link>
                      {item.profile.bio && (
                        <p className="text-[14px] text-[#6B7280] mt-1 truncate max-w-[80%]">{item.profile.bio}</p>
                      )}
                      
                      {item.socialCounts && (
                        <div className="flex items-center gap-3 mt-2 text-[12px]">
                          <div className="flex gap-1 items-center">
                            <span className="font-bold text-text-main/90">{item.socialCounts.followers}</span>
                            <span className="text-[#6B7280] uppercase tracking-wider text-[10px]">Followers</span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-foreground/20"></div>
                          <div className="flex gap-1 items-center">
                            <span className="font-bold text-text-main/90">{item.socialCounts.following}</span>
                            <span className="text-[#6B7280] uppercase tracking-wider text-[10px]">Following</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="shrink-0">
                      <FollowButton 
                        myProfileId={myProfileId} 
                        targetProfileId={item.profile.id} 
                        className="rounded-xl h-10 px-5 text-[13px] font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-[#6B7280]" />
                </div>
                <h3 className="text-lg font-bold text-text-main mb-2">No Profiles Found</h3>
                <p className="text-[#6B7280] max-w-sm">
                  We couldn't find anyone matching "{query}". Try searching with a different username.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Nav */}
        <div className="pt-6 flex justify-center">
          <Link href="/" className="text-[#6B7280] hover:text-text-main flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
        
      </div>
    </div>
  );
}

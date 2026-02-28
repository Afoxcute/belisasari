'use client';

import { Button } from '@/components/ui/button';
import { useContents } from '@/hooks/use-contents';
import { useCreatePost } from '@/hooks/use-create-post';
import { useCurrentWallet } from '@/hooks/use-current-wallet';
import { useGetProfiles } from '@/hooks/use-get-profiles';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Send, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FeedPageClient() {
  const { ready, authenticated, login } = usePrivy();
  const { walletAddress } = useCurrentWallet();
  const { profiles } = useGetProfiles({ walletAddress: walletAddress || '' });
  const myProfileId = profiles?.[0]?.profile?.id ?? null;
  const { data: feedData, loading: feedLoading, error: feedError } = useContents({
    requestingProfileId: myProfileId,
    pageSize: 50,
  });
  const { createPost, loading: creating, error: createError } = useCreatePost();
  const [postText, setPostText] = useState('');
  const { toast } = useToast();

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myProfileId || !postText.trim()) return;
    try {
      await createPost({ profileId: myProfileId, text: postText.trim() });
      setPostText('');
      toast({ title: 'Post created' });
      window.location.reload();
    } catch {
      toast({ title: createError || 'Failed to create post', variant: 'destructive' });
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="w-10 h-10 border-2 border-[#00D4FF]/30 border-t-[#00D4FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background-main flex flex-col pt-12">
        <div className="container max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="bg-card-bg border border-border-light rounded-xl p-8 shadow-lg">
            <h1 className="text-[24px] font-bold mb-4 text-text-main">Social Feed</h1>
            <p className="text-[#6B7280] text-[15px] mb-8">Log in to view and create posts.</p>
            <Button
              className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black font-semibold px-8 h-11"
              onClick={() => login({ loginMethods: ['wallet'], walletChainType: 'solana-only' })}
            >
              Log in
            </Button>
            <p className="mt-8 text-sm">
              <Link href="/" className="text-[#6B7280] hover:text-text-main transition-colors">Back to home</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
          <h1 className="text-[24px] font-bold text-text-main tracking-tight">Social Feed</h1>
        </div>

        {!myProfileId ? (
          <div className="bg-card-bg border border-border-light rounded-xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-6 w-6 text-[#6B7280]" />
            </div>
            <h2 className="text-[18px] font-semibold text-text-main mb-2">Almost there!</h2>
            <p className="text-[#6B7280] text-[14px] mb-6">Create a profile to start sharing your thoughts.</p>
            <Button asChild className="bg-foreground/10 hover:bg-foreground/20 text-text-main border border-border-light">
              <Link href="/profile">Set up profile</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Create Post Section */}
            <form onSubmit={handleCreatePost} className="mb-8 bg-card-bg border border-border-light rounded-xl p-5 shadow-sm transition-all focus-within:border-[#00D4FF]/50 focus-within:ring-1 focus-within:ring-[#00D4FF]/20">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's happening in the markets?"
                className="w-full min-h-[90px] bg-transparent text-[15px] text-text-main placeholder:text-[#6B7280] resize-none focus:outline-none"
                maxLength={500}
              />
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-light">
                <span className="text-[12px] font-medium text-[#6B7280]">{postText.length}/500</span>
                <Button 
                  type="submit" 
                  disabled={creating || !postText.trim()}
                  className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold h-9 px-5 rounded-lg disabled:opacity-50 disabled:bg-[#00D4FF]/50"
                >
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {creating ? 'Posting...' : 'Post'}
                </Button>
              </div>
              {createError && <p className="text-[13px] text-[#FF3B3B] mt-3 bg-[#FF3B3B]/10 p-2 rounded">{createError}</p>}
            </form>

            {feedError && (
              <div className="mb-6 p-4 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-xl">
                <p className="text-[14px] text-[#FF3B3B]">{feedError.message}</p>
              </div>
            )}

            {feedLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-2 border-[#00D4FF]/30 border-t-[#00D4FF] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {(feedData?.contents ?? []).length === 0 ? (
                  <div className="bg-card-bg border border-border-light rounded-xl p-12 text-center shadow-sm">
                    <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="h-5 w-5 text-[#6B7280]" />
                    </div>
                    <p className="text-[#6B7280] text-[15px]">No posts yet. Be the first to start the conversation!</p>
                  </div>
                ) : (
                  (feedData?.contents ?? []).map((item, idx) => (
                    <div key={item.content?.id ?? idx} className="bg-card-bg border border-border-light rounded-xl p-5 hover:bg-[#1A1A24] transition-colors group">
                      <div className="flex gap-4">
                        {item.authorProfile?.image ? (
                          <div className="w-10 h-10 rounded-full relative overflow-hidden border border-border-light shrink-0">
                            <Image
                              src={item.authorProfile.image}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-purple-500/20 border border-border-light flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-text-main/70" />
                          </div>
                        )}
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-[15px] text-text-main leading-none">
                              {item.authorProfile?.username ? `@${item.authorProfile.username}` : 'Anonymous User'}
                            </p>
                            <span className="text-[12px] text-[#6B7280] leading-none">•</span>
                            <span className="text-[12px] text-[#6B7280] leading-none">Just now</span>
                          </div>
                          
                          {/* The actual post content wasn't rendered in the original, adding it here if it exists or placeholder */}
                          <div className="text-[14px] text-text-main/90 leading-relaxed mt-2 mb-3">
                            {item.content?.text || (
                              <span className="italic text-[#6B7280]">Post content unavailable...</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-light">
                            <button className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#00FF88] transition-colors group/btn">
                              <div className="p-1.5 rounded-full group-hover/btn:bg-[#00FF88]/10 transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                              </div>
                              <span className="text-[13px] font-medium">{item.socialCounts?.likeCount ?? 0}</span>
                            </button>
                            
                            <button className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#00D4FF] transition-colors group/btn">
                              <div className="p-1.5 rounded-full group-hover/btn:bg-[#00D4FF]/10 transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                              </div>
                              <span className="text-[13px] font-medium">{item.socialCounts?.commentCount ?? 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-[14px] text-[#6B7280] hover:text-text-main transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

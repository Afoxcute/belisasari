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
import { Send, User } from 'lucide-react';
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-iris-primary/30 border-t-iris-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Social feed</h1>
        <p className="text-muted-foreground mb-6">Log in to view and create posts.</p>
        <Button className="bg-iris-primary" onClick={() => login({ loginMethods: ['wallet'], walletChainType: 'solana-only' })}>
          Log in
        </Button>
        <p className="mt-4 text-sm">
          <Link href="/" className="underline">Back to home</Link>
        </p>
      </div>
    );
  }

  const hasProfile = !!myProfileId;

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 tracking-tight text-iris-primary">Feed</h1>

      {!hasProfile ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-muted-foreground mb-4">Create a profile to post.</p>
          <Button asChild><Link href="/profile">Go to profile</Link></Button>
        </div>
      ) : (
        <>
          <form onSubmit={handleCreatePost} className="mb-8 rounded-xl border bg-card p-4">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's happening?"
              className="w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">{postText.length}/500</span>
              <Button type="submit" size="sm" disabled={creating || !postText.trim()}>
                <Send className="h-4 w-4 mr-1" /> Post
              </Button>
            </div>
            {createError && <p className="text-sm text-destructive mt-2">{createError}</p>}
          </form>

          {feedError && <p className="text-destructive mb-4">{feedError.message}</p>}
          {feedLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-iris-primary/30 border-t-iris-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {(feedData?.contents ?? []).length === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                  No posts yet. Be the first to post!
                </div>
              ) : (
                (feedData?.contents ?? []).map((item, idx) => (
                  <div key={item.content?.id ?? idx} className="rounded-xl border bg-card p-4">
                    <div className="flex gap-3">
                      {item.authorProfile?.image ? (
                        <Image
                          src={item.authorProfile.image}
                          alt=""
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">@{item.authorProfile?.username ?? 'unknown'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.socialCounts?.likeCount ?? 0} likes · {item.socialCounts?.commentCount ?? 0} comments
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/" className="underline">Back to home</Link>
      </p>
    </div>
  );
}

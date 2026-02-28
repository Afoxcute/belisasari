"use client";

import { useLogin, usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useGetProfiles } from "@/hooks/use-get-profiles";
import { useProfileDetail } from "@/hooks/use-profile-detail";
import { useSuggestedProfiles } from "@/hooks/use-suggested-profiles";
import { useSuggestedGlobal } from "@/hooks/use-suggested-global";
import { useCreatePost } from "@/hooks/use-create-post";
import { useToast } from "@/hooks/use-toast";
import { User, Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { ImportConnectionsSection } from "@/components/profile/ImportConnectionsSection";

export default function ProfilePageClient() {
  const { ready, authenticated, login } = usePrivy();
  const { walletAddress, mainUsername, loadingMainUsername } = useCurrentWallet();
  const { profiles, loading } = useGetProfiles({
    walletAddress: walletAddress || "",
  });
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const { createPost, loading: creatingComment } = useCreatePost();

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
      <div className="min-h-screen bg-background-main flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-card-bg border border-border-light rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-[#00D4FF]" />
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-3">Your Profile</h1>
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            Log in with your wallet to view and manage your profile securely on the network.
          </p>
          <Button
            className="w-full bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold h-12 text-[15px]"
            onClick={() => login({ loginMethods: ["wallet"], walletChainType: "solana-only" })}
          >
            Connect Wallet
          </Button>
          <div className="mt-6 pt-6 border-t border-border-light">
            <Link href="/" className="text-[#6B7280] hover:text-text-main text-sm flex items-center justify-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const loadingProfile = loadingMainUsername || loading;
  const primaryProfile = profiles?.[0];
  const hasProfile = !!primaryProfile?.profile?.username;
  const profileId = primaryProfile?.profile?.id ?? null;
  const { data: profileDetail } = useProfileDetail(hasProfile ? profileId : null);
  const followersCount = profileDetail?.socialCounts?.followers ?? 0;
  const followingCount = profileDetail?.socialCounts?.following ?? 0;
  const { profiles: suggestedFriends } = useSuggestedProfiles(walletAddress ?? null);
  const { profiles: suggestedGlobalProfiles } = useSuggestedGlobal(walletAddress ?? null);

  const suggestedFriendsList = Array.isArray(suggestedFriends) ? suggestedFriends : [];
  const suggestedGlobalList = Array.isArray(suggestedGlobalProfiles) ? suggestedGlobalProfiles : [];

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !commentText.trim()) return;
    try {
      await createPost({ profileId, text: commentText.trim() });
      setCommentText("");
      toast({ 
        title: "Success", 
        description: "Your comment has been posted to your profile.",
      });
    } catch {
      toast({ title: "Failed to post comment", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background-main py-8 px-4 text-text-main">
      <div className="container max-w-[800px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">
              My Profile
            </h1>
          </div>
          {hasProfile && (
            <Button asChild variant="outline" size="sm" className="bg-foreground/5 border-border-light text-text-main hover:bg-foreground/10 h-9">
              <Link href="/feed">View Feed</Link>
            </Button>
          )}
        </div>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-20 bg-card-bg border border-border-light rounded-2xl">
            <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
          </div>
        ) : hasProfile ? (
          <div className="space-y-6">
            
            {/* Identity Card */}
            <div className="rounded-2xl border border-border-light bg-card-bg overflow-hidden relative">
              <div className="h-32 bg-gradient-to-r from-[#00D4FF]/20 via-[#A855F7]/20 to-transparent"></div>
              
              <div className="px-6 sm:px-8 pb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-12 mb-6">
                  <div className="shrink-0 relative">
                    <div className="absolute inset-0 bg-[#00D4FF] blur-md opacity-30 rounded-full"></div>
                    {primaryProfile.profile.image ? (
                      <Image
                        src={primaryProfile.profile.image}
                        alt={primaryProfile.profile.username}
                        width={112}
                        height={112}
                        className="rounded-full object-cover border-4 border-[#111118] relative z-10 bg-card-bg"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-[#1A1A24] flex items-center justify-center border-4 border-[#111118] relative z-10">
                        <User className="h-12 w-12 text-[#6B7280]" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0 pb-2 flex flex-col sm:flex-row justify-between w-full sm:items-end gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-text-main tracking-tight mb-1">
                        @{primaryProfile.profile.username}
                      </h2>
                      {walletAddress && (
                        <p className="text-[13px] text-[#A855F7] font-mono break-all max-w-[280px] sm:max-w-[400px] truncate mb-2">
                          {walletAddress}
                        </p>
                      )}
                      <div className="flex items-center justify-center sm:justify-start gap-4 text-[14px]">
                        <div className="flex gap-1.5 items-center">
                          <span className="font-bold text-text-main">{followersCount}</span>
                          <span className="text-[#6B7280]">Followers</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-foreground/20"></div>
                        <div className="flex gap-1.5 items-center">
                          <span className="font-bold text-text-main">{followingCount}</span>
                          <span className="text-[#6B7280]">Following</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex justify-center">
                      <EditProfileDialog
                        profileId={primaryProfile.profile.id}
                        currentUsername={primaryProfile.profile.username}
                        currentBio={primaryProfile.profile.bio}
                        currentImage={primaryProfile.profile.image}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-border-light rounded-xl p-5">
                  <h3 className="text-[12px] uppercase tracking-wider font-semibold text-[#6B7280] mb-2">Bio</h3>
                  <p className="text-text-main/90 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {primaryProfile.profile.bio?.trim() || <span className="text-text-main/40 italic">No bio provided.</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid for Connections & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Network Suggestions */}
              <div className="rounded-2xl border border-border-light bg-card-bg p-6">
                <h3 className="text-lg font-semibold text-text-main mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"></span>
                  Network Discovery
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[13px] font-medium text-[#6B7280] mb-3 uppercase tracking-wider">Suggested Friends</h4>
                    {suggestedFriendsList.length > 0 ? (
                      <div className="space-y-2">
                        {suggestedFriendsList.slice(0, 4).map((item: { profile?: { id: string; username: string } }) => (
                          <Link 
                            key={item.profile?.id}
                            href={`/discover?q=${item.profile?.username ?? ''}`} 
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-border-light transition-all group"
                          >
                            <span className="font-medium text-text-main group-hover:text-[#00D4FF] transition-colors">
                              @{item.profile?.username ?? '—'}
                            </span>
                            <span className="text-[12px] text-[#6B7280] group-hover:text-text-main/60">View</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-border-light text-center">
                        <p className="text-[#6B7280] text-[13px]">No friends suggested yet.</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-[13px] font-medium text-[#6B7280] mb-3 uppercase tracking-wider">Global Profiles</h4>
                    {suggestedGlobalList.length > 0 ? (
                      <div className="space-y-2">
                        {suggestedGlobalList.slice(0, 4).map((p: { profile?: { id: string; username: string } }) => (
                          <Link 
                            key={p.profile?.id}
                            href={`/discover?q=${p.profile?.username ?? ''}`} 
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-border-light transition-all group"
                          >
                            <span className="font-medium text-text-main group-hover:text-[#00D4FF] transition-colors">
                              @{p.profile?.username ?? '—'}
                            </span>
                            <span className="text-[12px] text-[#6B7280] group-hover:text-text-main/60">View</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-border-light text-center">
                        <p className="text-[#6B7280] text-[13px]">No global suggestions available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Compose Section */}
              <div className="rounded-2xl border border-border-light bg-card-bg p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-text-main mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]"></span>
                  Leave a Note
                </h3>
                
                <form onSubmit={handleSendComment} className="flex-1 flex flex-col">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or status update..."
                    className="flex-1 w-full min-h-[140px] rounded-xl border border-border-light bg-white/[0.02] p-4 text-[15px] placeholder:text-[#6B7280] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] resize-none transition-all disabled:opacity-50"
                    disabled={creatingComment}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-semibold px-6 h-10 transition-all"
                      disabled={creatingComment || !commentText.trim()}
                    >
                      {creatingComment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post Status
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {walletAddress && (
              <div className="rounded-2xl border border-border-light bg-card-bg overflow-hidden">
                <ImportConnectionsSection walletAddress={walletAddress} />
              </div>
            )}
            
          </div>
        ) : (
          <div className="rounded-2xl border border-border-light bg-card-bg p-12 text-center shadow-xl">
            <div className="w-20 h-20 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-[#00D4FF] blur-md opacity-20 rounded-full"></div>
              <User className="h-10 w-10 text-[#00D4FF] relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-3">No Profile Yet</h2>
            <p className="text-[#6B7280] mb-8 max-w-md mx-auto leading-relaxed">
              Create your identity on the network to set up your username, bio, and start connecting with others.
            </p>
            <Button asChild className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold h-12 px-8 text-[15px]">
              <Link href="/">Create Profile</Link>
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pt-8 text-[14px]">
          <Link href="/" className="text-[#6B7280] hover:text-text-main flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          {hasProfile && (
            <>
              <span className="text-[#6B7280]">•</span>
              <Link href="/feed" className="text-[#00D4FF] hover:text-[#00D4FF]/80 font-medium transition-colors">
                View Feed
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

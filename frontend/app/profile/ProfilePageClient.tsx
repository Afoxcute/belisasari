"use client";

import { useLogin, usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useGetProfiles } from "@/hooks/use-get-profiles";
import { useProfileDetail } from "@/hooks/use-profile-detail";
import { shortenAddress } from "@/lib/utils";
import { User } from "lucide-react";
import Link from "next/link";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { ImportConnectionsSection } from "@/components/profile/ImportConnectionsSection";

export default function ProfilePageClient() {
  const { ready, authenticated, login } = usePrivy();
  const { walletAddress, mainUsername, loadingMainUsername } = useCurrentWallet();
  const { profiles, loading } = useGetProfiles({
    walletAddress: walletAddress || "",
  });

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-iris-primary/30 border-t-iris-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">Your profile</h1>
          <p className="text-muted-foreground mb-6">
            Log in with your wallet to view and manage your profile.
          </p>
          <Button
            className="bg-iris-primary hover:bg-iris-primary/80"
            onClick={() => login({ loginMethods: ["wallet"], walletChainType: "solana-only" })}
          >
            Log in
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/" className="underline hover:text-foreground">Back to home</Link>
          </p>
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

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-iris-primary">
          My profile
        </h1>
        {hasProfile && (
          <Button asChild variant="outline" size="sm">
            <Link href="/feed">Feed</Link>
          </Button>
        )}
      </div>

      {loadingProfile ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-2 border-iris-primary/30 border-t-iris-primary rounded-full animate-spin" />
        </div>
      ) : hasProfile ? (
        <>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="shrink-0">
                  {primaryProfile.profile.image ? (
                    <Image
                      src={primaryProfile.profile.image}
                      alt={primaryProfile.profile.username}
                      width={96}
                      height={96}
                      className="rounded-full object-cover border-2 border-iris-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-iris-primary/20">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold truncate">
                      {primaryProfile.profile.username}
                    </h2>
                    <EditProfileDialog
                      profileId={primaryProfile.profile.id}
                      currentUsername={primaryProfile.profile.username}
                      currentBio={primaryProfile.profile.bio}
                      currentImage={primaryProfile.profile.image}
                    />
                  </div>
                  {primaryProfile.profile.bio && (
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                      {primaryProfile.profile.bio}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{followersCount} followers</span>
                    <span>{followingCount} following</span>
                  </div>
                  {walletAddress && (
                    <p className="mt-3 text-sm text-muted-foreground font-mono">
                      {shortenAddress(walletAddress)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {walletAddress && <ImportConnectionsSection walletAddress={walletAddress} />}
        </>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No profile yet</h2>
          <p className="text-muted-foreground mb-6">
            Create a Tapestry profile to show your username and bio here.
          </p>
          <Button asChild className="bg-iris-primary hover:bg-iris-primary/80">
            <Link href="/">Create profile</Link>
          </Button>
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/" className="underline hover:text-foreground">Back to home</Link>
        {hasProfile && (
          <>
            {' · '}
            <Link href="/feed" className="underline hover:text-foreground">Feed</Link>
          </>
        )}
      </p>
    </div>
  );
}

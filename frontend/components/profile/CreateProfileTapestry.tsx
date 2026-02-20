'use client';

import { useCurrentWallet } from '@/hooks/use-current-wallet';
import { useCreateProfileTapestry } from '@/hooks/use-create-profile-tapestry';
import { useGetIdentities } from '@/hooks/use-get-identities';
import type { IProfileList } from '@/lib/types/profile';
import { usePrivy } from '@privy-io/react-auth';
import { User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CreateProfileTapestryProps {
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export function CreateProfileTapestry({ onClose, onSuccess }: CreateProfileTapestryProps) {
  const { walletAddress, loadingMainUsername } = useCurrentWallet();
  const { logout } = usePrivy();
  const [username, setUsername] = useState('');
  const [selectProfile, setSelectProfile] = useState<IProfileList | null>(null);

  const { createProfile, loading: creationLoading, error } = useCreateProfileTapestry();
  const { data: identities, loading: profilesLoading } = useGetIdentities({
    walletAddress: walletAddress || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (walletAddress && username) {
      await createProfile({ username, walletAddress });
      onSuccess(username);
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setUsername(value);
  };

  const handleImport = async (entry: IProfileList) => {
    if (!walletAddress) return;
    try {
      await createProfile({
        username: entry.profile.username,
        walletAddress,
        bio: entry.profile.bio,
        image: entry.profile.image,
      });
      onSuccess(entry.profile.username);
      onClose();
    } catch {
      // error shown via useCreateProfileTapestry
    }
  };

  if (loadingMainUsername && profilesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Create profile</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          value={username}
          onChange={handleInputChange}
          placeholder="username"
          className="lowercase"
        />
        <Button type="submit" disabled={creationLoading || !username.trim()}>
          {creationLoading ? 'Creating...' : 'Create profile'}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="border-t pt-4">
        <p className="text-muted-foreground text-sm mb-2">Or import from Tapestry</p>
        {identities?.identities?.length ? (
          <div className="max-h-[200px] space-y-2 overflow-auto">
            {identities.identities.map((identity, i) =>
              identity.profiles?.length
                ? identity.profiles.map((entry, j) => (
                    <Button
                      key={`${i}-${j}`}
                      variant="ghost"
                      disabled={profilesLoading}
                      onClick={() => setSelectProfile(entry)}
                      className={cn(
                        'w-full justify-start border',
                        selectProfile === entry ? 'border-primary' : 'border-muted'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {entry.profile.image ? (
                          <Image
                            width={32}
                            height={32}
                            alt=""
                            className="rounded-full object-cover"
                            src={entry.profile.image}
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 text-left">
                          <p className="truncate font-medium">{entry.profile.username}</p>
                          {entry.profile.bio && (
                            <p className="truncate text-xs text-muted-foreground">
                              {entry.profile.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))
                : null
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {profilesLoading ? 'Loading Tapestry profiles...' : 'No Tapestry profiles found. Create one above.'}
          </p>
        )}

        <Button
          className="mt-2 w-full"
          variant="secondary"
          disabled={profilesLoading || !selectProfile}
          onClick={() => selectProfile && handleImport(selectProfile)}
        >
          {creationLoading ? 'Importing...' : 'Import profile'}
        </Button>
      </div>

      <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { logout(); onClose(); }}>
        Disconnect wallet
      </Button>
    </div>
  );
}

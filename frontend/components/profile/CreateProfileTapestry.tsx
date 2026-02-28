'use client';

import { useCurrentWallet } from '@/hooks/use-current-wallet';
import { useCreateProfileTapestry } from '@/hooks/use-create-profile-tapestry';
import { useGetIdentities } from '@/hooks/use-get-identities';
import type { IProfileList } from '@/lib/types/profile';
import { usePrivy } from '@privy-io/react-auth';
import { User, Loader2 } from 'lucide-react';
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
        <Loader2 className="h-8 w-8 animate-spin text-[#00D4FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
        <Input
          value={username}
          onChange={handleInputChange}
          placeholder="username"
          className="lowercase bg-foreground/5 border-border-light text-text-main focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] placeholder:text-[#6B7280]"
        />
        <Button 
          type="submit" 
          disabled={creationLoading || !username.trim()}
          className="bg-[#00D4FF] text-[#111118] hover:bg-[#00D4FF]/80 hover:text-[#111118] w-full"
        >
          {creationLoading ? 'Creating...' : 'Create profile'}
        </Button>
      </form>

      {error && <p className="text-[13px] text-red-500 font-medium">{error}</p>}

      <div className="border-t border-border-light pt-5">
        <p className="text-[#6B7280] text-[13px] font-medium mb-3">Or import from Tapestry</p>
        {identities?.identities?.length ? (
          <div className="max-h-[220px] space-y-2 overflow-auto pr-1">
            {identities.identities.map((identity, i) =>
              identity.profiles?.length
                ? identity.profiles.map((entry, j) => (
                    <Button
                      key={`${i}-${j}`}
                      variant="ghost"
                      disabled={profilesLoading}
                      onClick={() => setSelectProfile(entry)}
                      className={cn(
                        'w-full justify-start border h-auto py-3 hover:bg-foreground/5 transition-colors',
                        selectProfile === entry ? 'border-[#00D4FF] bg-[#00D4FF]/5' : 'border-border-light bg-white/[0.02]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {entry.profile.image ? (
                          <Image
                            width={36}
                            height={36}
                            alt={entry.profile.username}
                            className="rounded-full object-cover border border-border-light"
                            src={entry.profile.image}
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A24] border border-border-light">
                            <User className="h-4 w-4 text-[#6B7280]" />
                          </div>
                        )}
                        <div className="min-w-0 text-left flex-1">
                          <p className={`truncate text-[14px] font-bold ${selectProfile === entry ? 'text-text-main' : 'text-text-main/90'}`}>
                            {entry.profile.username}
                          </p>
                          {entry.profile.bio && (
                            <p className="truncate text-[12px] text-[#6B7280] mt-0.5">
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
          <p className="text-[13px] text-[#6B7280] bg-white/[0.02] border border-border-light rounded-lg p-4 text-center">
            {profilesLoading ? 'Loading Tapestry profiles...' : 'No Tapestry profiles found. Create one above.'}
          </p>
        )}

        <Button
          className="mt-3 w-full bg-foreground/5 text-text-main hover:bg-foreground/10 border border-border-light"
          variant="secondary"
          disabled={profilesLoading || !selectProfile}
          onClick={() => selectProfile && handleImport(selectProfile)}
        >
          {creationLoading ? 'Importing...' : 'Import selected profile'}
        </Button>
      </div>

      <div className="pt-2">
        <Button 
          variant="ghost" 
          className="w-full text-[#6B7280] hover:text-text-main hover:bg-foreground/5 text-[13px]" 
          onClick={() => { logout(); onClose(); }}
        >
          Disconnect wallet
        </Button>
      </div>
    </div>
  );
}

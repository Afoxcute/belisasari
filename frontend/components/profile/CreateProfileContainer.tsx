'use client';

import { useCurrentWallet } from '@/hooks/use-current-wallet';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateProfileTapestry } from './CreateProfileTapestry';

interface CreateProfileContainerProps {
  onProfileCreated: (username: string) => void;
}

export function CreateProfileContainer({ onProfileCreated }: CreateProfileContainerProps) {
  const [open, setOpen] = useState(false);
  const { walletAddress, mainUsername, loadingMainUsername } = useCurrentWallet();

  useEffect(() => {
    if (walletAddress && !mainUsername && !loadingMainUsername) {
      setOpen(true);
    }
  }, [walletAddress, mainUsername, loadingMainUsername]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-card-bg border-border-light text-text-main shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create your profile</DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Create a new username or import your Tapestry profile to use Belisasari.
          </DialogDescription>
        </DialogHeader>
        <CreateProfileTapestry
          onClose={() => setOpen(false)}
          onSuccess={(username) => {
            onProfileCreated(username);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

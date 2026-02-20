'use client';

import { useGetProfiles } from '@/hooks/use-get-profiles';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export function useCurrentWallet() {
  const [walletAddress, setWalletAddress] = useState('');
  const { user, authenticated, ready } = usePrivy();
  const { profiles, loading } = useGetProfiles({
    walletAddress: walletAddress || '',
  });

  useEffect(() => {
    if (authenticated && ready && user?.wallet?.address) {
      setWalletAddress(user.wallet.address);
    } else {
      setWalletAddress('');
    }
  }, [user, authenticated, ready]);

  return {
    walletIsConnected: !!walletAddress,
    walletAddress,
    mainUsername: profiles?.[0]?.profile?.username,
    loadingMainUsername: loading,
    setWalletAddress,
  };
}

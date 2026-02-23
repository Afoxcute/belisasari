'use client';

import React, { useMemo } from 'react';
import { PrivyProvider, useLogin, usePrivy } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { AppAuthContextProvider } from './PrivyAppAuthContext';
import { AppAuthStubProvider } from './PrivyAppAuthContext';

function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { login: privyLogin } = useLogin();
  const value = useMemo(
    () => ({
      ready,
      authenticated: authenticated ?? false,
      user: user ?? null,
      login: (opts?: unknown) => {
        privyLogin(opts as Parameters<typeof privyLogin>[0] | undefined);
      },
      logout: logout ?? (async () => {}),
    }),
    [ready, authenticated, user, privyLogin, logout]
  );
  return (
    <AppAuthContextProvider value={value}>
      {children}
    </AppAuthContextProvider>
  );
}

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
const hasValidPrivyId = Boolean(PRIVY_APP_ID && PRIVY_APP_ID.length >= 10);

export function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  if (!hasValidPrivyId) {
    return <AppAuthStubProvider>{children}</AppAuthStubProvider>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID!}
      config={{
        appearance: { walletChainType: 'solana-only' },
        externalWallets: {
          solana: { connectors: toSolanaWalletConnectors() },
        },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}

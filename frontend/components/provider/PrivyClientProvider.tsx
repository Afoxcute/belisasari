'use client';

import { PrivyProvider, usePrivy, useLogin } from '@privy-io/react-auth';
import { AppAuthContextProvider } from '@/components/provider/PrivyAppAuthContext';

/**
 * Bridges Privy state into AppAuth context so Layout/useCurrentWallet can use useAppAuth()
 * and work both with and without Privy (when app ID is missing we use AppAuthStubProvider).
 */
function PrivyAppAuthBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { login: privyLogin } = useLogin();
  const login: (opts?: unknown) => void | Promise<void> = (opts) => {
    (privyLogin as (o?: unknown) => void)(opts);
  };
  return (
    <AppAuthContextProvider
      value={{
        ready,
        authenticated,
        user: user ? { wallet: user.wallet ? { address: user.wallet.address } : undefined, username: (user as { username?: string }).username } : null,
        login,
        logout,
      }}
    >
      {children}
    </AppAuthContextProvider>
  );
}

/**
 * Privy provider without @privy-io/react-auth/solana to avoid build errors from
 * mismatched @solana/* deps. When app ID is missing (e.g. Docker env), render only children
 * so parent can use AppAuthStubProvider and we avoid "invalid Privy app ID" and portal crashes.
 */
export function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  const appId = typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID === 'string'
    ? process.env.NEXT_PUBLIC_PRIVY_APP_ID.trim()
    : '';
  if (!appId) {
    return <>{children}</>;
  }
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: { walletChainType: 'solana-only' },
      }}
    >
      <PrivyAppAuthBridge>{children}</PrivyAppAuthBridge>
    </PrivyProvider>
  );
}

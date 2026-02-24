'use client';

import { PrivyProvider } from '@privy-io/react-auth';

/**
 * Privy provider without @privy-io/react-auth/solana to avoid build errors from
 * mismatched @solana/* deps (bytesEqual, toArrayBuffer, SOLANA_ERROR__* not exported).
 * Solana wallets are connected via the existing SolanaWalletProvider / wallet-adapter stack.
 */
export function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: { walletChainType: 'solana-only' },
        // externalWallets.solana omitted to avoid bundling @privy-io/react-auth/solana
        // and its broken @solana/* dependency tree. Use wallet-adapter for Phantom etc.
      }}
    >
      {children}
    </PrivyProvider>
  );
}

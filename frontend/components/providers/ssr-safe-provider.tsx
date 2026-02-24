'use client';

import { useEffect, useState } from 'react';
import { EnvironmentStoreProvider } from '@/components/context';
import SolanaWalletProvider from './wallet-provider';
import { ThemeProvider } from './theme-provider';
import { PrivyClientProvider } from '@/components/provider/PrivyClientProvider';
import Layout from '@/components/sections/layout';
import { Toaster } from '@/components/ui/toaster';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <img src="/belisasari.png" alt="Belisasari" className="w-16 h-16 mx-auto mb-4 rounded-full" />
        <div className="w-8 h-8 border-2 border-iris-primary/20 border-t-iris-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading Belisasari...</p>
      </div>
    </div>
  );
}

export default function SSRSafeProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Delay Privy/portals until after DOM is committed (avoids HierarchyRequestError: Only one element on document)
  useEffect(() => {
    if (!isClient) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, [isClient]);

  // Never render full app tree on server (standalone/Docker); avoids "Element type is invalid... got: undefined"
  const canRenderApp = typeof window !== 'undefined' && isClient && ready;
  if (!canRenderApp) {
    return <LoadingFallback />;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {PrivyClientProvider ? (
        <PrivyClientProvider>
          <EnvironmentStoreProvider>
            <SolanaWalletProvider>
              <Layout>{children}</Layout>
              <Toaster />
            </SolanaWalletProvider>
          </EnvironmentStoreProvider>
        </PrivyClientProvider>
      ) : (
        <EnvironmentStoreProvider>
          <SolanaWalletProvider>
            <Layout>{children}</Layout>
            <Toaster />
          </SolanaWalletProvider>
        </EnvironmentStoreProvider>
      )}
    </ThemeProvider>
  );
}

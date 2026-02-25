'use client';

import React, { useEffect, useState } from 'react';
import { EnvironmentStoreProvider } from '@/components/context';
import SolanaWalletProvider from './wallet-provider';
import { ThemeProvider } from './theme-provider';
import { PrivyClientProvider } from '@/components/provider/PrivyClientProvider';
import { AppAuthPrivyProvider } from '@/components/provider/PrivyAppAuthContext';
import Layout from '@/components/sections/layout';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/dashboard/error-boundary';

function AppTree({ children }: { children: React.ReactNode }) {
  return (
    <EnvironmentStoreProvider>
      <SolanaWalletProvider>
        <PrivyClientProvider>
          <AppAuthPrivyProvider>
            <Layout>{children}</Layout>
            <Toaster />
          </AppAuthPrivyProvider>
        </PrivyClientProvider>
      </SolanaWalletProvider>
    </EnvironmentStoreProvider>
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

  if (!isClient || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AppTree>{children}</AppTree>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

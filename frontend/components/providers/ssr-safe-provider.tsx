'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { EnvironmentStoreProvider } from '@/components/context';
import SolanaWalletProvider from './wallet-provider';
import { ThemeProvider } from './theme-provider';
import Layout from '@/components/sections/layout';
import { Toaster } from '@/components/ui/toaster';

const PrivyClientProvider = dynamic(
  () =>
    import('@/components/provider/PrivyClientProvider').then((m) => ({
      default: m.PrivyClientProvider,
    })),
  { ssr: false }
);

export default function SSRSafeProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Wait for client and a tick so document.body exists and we avoid "Only one element on document" (Privy/portal)
  if (!isClient || !isMounted || (typeof document !== 'undefined' && !document.body)) {
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

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <PrivyClientProvider>
        <EnvironmentStoreProvider>
          <SolanaWalletProvider>
            <Layout>{children}</Layout>
            <Toaster />
          </SolanaWalletProvider>
        </EnvironmentStoreProvider>
      </PrivyClientProvider>
    </ThemeProvider>
  );
}

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

  if (!isClient || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
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

'use client';

import React, { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { EnvironmentStoreProvider } from '@/components/context';
import SolanaWalletProvider from './wallet-provider';
import { ThemeProvider } from './theme-provider';
import { PrivyClientProvider } from '@/components/provider/PrivyClientProvider';
import { AppAuthStubProvider } from '@/components/provider/PrivyAppAuthContext';
import Layout from '@/components/sections/layout';
import { Toaster } from '@/components/ui/toaster';

/** Catches "Element type is invalid" and similar so the app still shows a fallback instead of crashing. */
class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  state = { hasError: false as boolean, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <p className="text-muted-foreground mb-2">Something went wrong loading the app.</p>
            <p className="text-sm text-muted-foreground/80">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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

function AppTree({ children }: { children: React.ReactNode }) {
  const hasPrivyId = typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID === 'string' &&
    process.env.NEXT_PUBLIC_PRIVY_APP_ID.trim().length > 0;
  const AuthWrapper = hasPrivyId ? PrivyClientProvider : AppAuthStubProvider;
  return (
    <AuthWrapper>
      <EnvironmentStoreProvider>
        <SolanaWalletProvider>
          <Layout>{children}</Layout>
          <Toaster />
        </SolanaWalletProvider>
      </EnvironmentStoreProvider>
    </AuthWrapper>
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
    <RootErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AppTree>{children}</AppTree>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}

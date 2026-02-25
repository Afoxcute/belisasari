'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { usePrivy, useLogin } from '@privy-io/react-auth';

export type AppAuthValue = {
  ready: boolean;
  authenticated: boolean;
  user: { wallet?: { address: string }; username?: string } | null;
  /** Opens Privy login modal (wallet, email, etc.). Use this for "Connect wallet" / "Log in". */
  login: (opts?: unknown) => void | Promise<void>;
  logout: () => void | Promise<void>;
};

const stubAuth: AppAuthValue = {
  ready: true,
  authenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
};

const AppAuthContext = createContext<AppAuthValue>(stubAuth);

export function AppAuthStubProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppAuthContext.Provider value={stubAuth}>
      {children}
    </AppAuthContext.Provider>
  );
}

/**
 * Wires Privy (usePrivy + useLogin) into AppAuthContext. Must be used inside PrivyClientProvider.
 */
export function AppAuthPrivyProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { login } = useLogin();

  const value = useMemo<AppAuthValue>(
    () => ({
      ready,
      authenticated: !!authenticated,
      user: user
        ? {
            wallet: user.wallet ? { address: user.wallet.address } : undefined,
            username: (user as { username?: string }).username,
          }
        : null,
      login: login as AppAuthValue['login'],
      logout,
    }),
    [ready, authenticated, user, login, logout]
  );

  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function AppAuthContextProvider({
  value,
  children,
}: {
  value: AppAuthValue;
  children: React.ReactNode;
}) {
  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AppAuthContext);
}

'use client';

import React, { createContext, useContext } from 'react';

export type AppAuthValue = {
  ready: boolean;
  authenticated: boolean;
  user: { wallet?: { address: string }; username?: string } | null;
  login: (opts?: { loginMethods?: string[]; walletChainType?: string }) => Promise<void>;
  logout: () => Promise<void>;
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

"use client";

import dynamic from "next/dynamic";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useAppAuth } from "@/components/provider/PrivyAppAuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SwapCard = dynamic(
  () => import("@/components/trading/SwapCard").then((m) => m.SwapCard),
  { ssr: false }
);

export default function TradingPageClient() {
  const { walletIsConnected } = useCurrentWallet();
  const { ready, authenticated, login } = useAppAuth();

  if (!walletIsConnected) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-2 text-iris-primary">Trading (Jupiter)</h1>
        <p className="text-muted-foreground mb-4">
          Token swap with DEX aggregation and slippage protection. Connect your wallet (e.g. Phantom) via Privy to trade.
        </p>
        <Button
          className="bg-iris-primary hover:bg-iris-primary/80"
          disabled={!ready || (ready && authenticated)}
          onClick={() => {
            if (ready && !authenticated) {
              login({
                loginMethods: ["wallet"],
                walletChainType: "solana-only",
                disableSignup: false,
              });
            }
          }}
        >
          Log in
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">Back to home</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-iris-primary">Trading (Jupiter)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Token swapping · DEX aggregation for best prices · Slippage protection
        </p>
      </div>
      <SwapCard />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Powered by Jupiter. <Link href="/" className="underline">Home</Link>
      </p>
    </div>
  );
}

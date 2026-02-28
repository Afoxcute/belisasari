"use client";

import dynamic from "next/dynamic";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useAppAuth } from "@/components/provider/PrivyAppAuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";

const SwapCard = dynamic(
  () => import("@/components/trading/SwapCard").then((m) => m.SwapCard),
  { ssr: false }
);

export default function TradingPageClient() {
  const { walletIsConnected } = useCurrentWallet();
  const { ready, authenticated, login } = useAppAuth();

  if (!walletIsConnected) {
    return (
      <div className="min-h-screen bg-background-main pt-20 px-4">
        <div className="container max-w-md mx-auto text-center bg-card-bg border border-border-light rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-8 w-8 text-[#00D4FF]" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-text-main">Trading (Jupiter)</h1>
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            Token swap with DEX aggregation and slippage protection. Connect your wallet to start trading.
          </p>
          <Button
            className="w-full bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold h-12 text-[15px]"
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
            Connect Wallet
          </Button>
          <div className="mt-8 pt-6 border-t border-border-light">
            <Link href="/" className="text-[#6B7280] hover:text-text-main flex items-center justify-center gap-2 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background-main py-12 px-4 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00D4FF]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#A855F7]/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <div className="container max-w-[520px] mx-auto">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-foreground/5 border border-border-light mb-4">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#00D4FF]">Jupiter Aggregator</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main mb-2">Swap Tokens</h1>
          <p className="text-[15px] text-[#6B7280]">
            Best prices across all Solana DEXes instantly.
          </p>
        </div>
        
        <SwapCard />
        
        <div className="mt-8 flex items-center justify-between text-[13px] text-[#6B7280] px-4">
          <Link href="/" className="hover:text-text-main flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="font-semibold text-text-main">Jupiter</span>
          </div>
        </div>
      </div>
    </div>
  );
}

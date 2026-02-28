"use client";

import { useParams } from "next/navigation";
import { useTokenInfoTrading } from "@/hooks/use-token-info-trading";
import { SOL_MINT } from "@/lib/trading-constants";
import { ArrowLeft, ExternalLink, LineChart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const BIRDEYE_WIDGET_BASE = "https://birdeye.so/tv-widget";

export default function TokenChartPage() {
  const params = useParams();
  const address = typeof params?.address === "string" ? params.address : "";
  const { symbol, name, imageUrl } = useTokenInfoTrading(address);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const quoteMint = SOL_MINT;
  const iframeSrc =
    address && address !== quoteMint
      ? `${BIRDEYE_WIDGET_BASE}/${address}/${quoteMint}?chain=solana&theme=dark&chartType=Candle&chartInterval=1D&chartLeftToolbar=show&viewMode=base%2Fquote`
      : "";

  if (!address) {
    return (
      <div className="min-h-screen bg-background-main pt-20 px-4">
        <div className="container max-w-md mx-auto text-center bg-card-bg border border-border-light rounded-2xl p-8 shadow-xl">
          <p className="text-[#6B7280] mb-6">Missing token address.</p>
          <Link href="/trading" className="text-[#00D4FF] hover:text-[#00D4FF]/80 flex items-center justify-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Trading
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background-main text-text-main">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center text-sm mb-8">
          <Link
            href="/trading"
            className="text-[#6B7280] hover:text-text-main flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trading
          </Link>
          <span className="mx-3 text-text-main/20">/</span>
          <span className="text-text-main font-medium flex items-center gap-1.5">
            <LineChart className="w-4 h-4 text-[#00D4FF]" />
            Chart
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={symbol}
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-[#1A1A24]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1A1A24] border border-border-light flex items-center justify-center text-[12px] text-[#6B7280]">
                  {symbol.slice(0, 2)}
                </div>
              )}
              {/* Optional verification badge could go here */}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
                {symbol || "Token"}
                <span className="text-[#6B7280] text-[15px] font-medium tracking-normal">/ SOL</span>
              </h1>
              <p className="text-[14px] text-[#6B7280] truncate max-w-[280px]">
                {name || address}
              </p>
            </div>
          </div>
          
          <a
            href={`https://solscan.io/token/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 border border-border-light rounded-lg text-[13px] text-[#6B7280] hover:text-text-main transition-colors"
          >
            {address.slice(0, 4)}...{address.slice(-4)}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {address === quoteMint ? (
          <div className="rounded-2xl border border-border-light bg-card-bg p-12 text-center text-[#6B7280] flex flex-col items-center justify-center shadow-2xl">
            <LineChart className="w-12 h-12 mb-4 opacity-50" />
            <p className="max-w-md">Chart is for token vs SOL. SOL is the quote currency; select another token from Trading to view its chart.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border-light bg-card-bg overflow-hidden shadow-2xl relative">
            <div className="px-5 py-3 border-b border-border-light bg-white/[0.02] flex items-center justify-between">
              <span className="text-[12px] text-[#6B7280] font-medium tracking-wide uppercase">Powered by Birdeye</span>
            </div>
            <iframe
              title={`${symbol || "Token"} price chart`}
              src={iframeSrc}
              className="w-full h-[600px] border-0"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
}

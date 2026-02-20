"use client";

import { useParams } from "next/navigation";
import { useTokenInfoTrading } from "@/hooks/use-token-info-trading";
import { SOL_MINT } from "@/lib/trading-constants";
import { ArrowLeft } from "lucide-react";
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

  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";
  const quoteMint = SOL_MINT;
  const iframeSrc =
    address && address !== quoteMint
      ? `${BIRDEYE_WIDGET_BASE}/${address}/${quoteMint}?chain=solana&theme=${theme}&chartType=Candle&chartInterval=1D&chartLeftToolbar=show&viewMode=base%2Fquote`
      : "";

  if (!address) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <p className="text-muted-foreground">Missing token address.</p>
        <Link href="/trading" className="text-iris-primary underline mt-2 inline-block">
          Back to Trading
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/trading"
          className="p-2 rounded-lg hover:bg-muted inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trading
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted" />
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-iris-primary">
            {symbol || "Token"}
          </h1>
          <p className="text-sm text-muted-foreground truncate max-w-[280px]">
            {name || address}
          </p>
        </div>
      </div>
      {address === quoteMint ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          Chart is for token vs SOL. SOL is the quote currency; select another token from Trading to view its chart.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <iframe
            title={`${symbol || "Token"} price chart`}
            src={iframeSrc}
            className="w-full h-[520px] border-0"
            allowFullScreen
          />
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Chart by{" "}
        <a
          href="https://birdeye.so"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Birdeye
        </a>
      </p>
    </div>
  );
}

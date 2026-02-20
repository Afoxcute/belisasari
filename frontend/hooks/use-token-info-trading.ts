"use client";

import { DEFAULT_TOKENS, SOL_MINT } from "@/lib/trading-constants";
import type { ITokenSearchResult } from "@/lib/types/jupiter";
import type { UltraMintInfo } from "@/lib/types/jupiter";
import { useEffect, useState } from "react";

function mapUltraMintToResult(m: UltraMintInfo): ITokenSearchResult {
  return {
    address: m.id,
    symbol: m.symbol ?? "?",
    name: m.name ?? "Unknown",
    decimals: m.decimals ?? 6,
    logoURI: m.icon ?? undefined,
    price: m.usdPrice ?? undefined,
    market_cap: m.mcap ?? undefined,
    verified: m.isVerified ?? undefined,
  };
}

/** Token info via Jupiter Ultra search - supports all tokens on Ultra. */
export function useTokenInfoTrading(mint: string) {
  const [info, setInfo] = useState<ITokenSearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mint) {
      setInfo(null);
      setLoading(false);
      return;
    }
    const known = DEFAULT_TOKENS.find((t) => t.address === mint);
    if (known) {
      setInfo(known);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/jupiter/ultra/search?query=${encodeURIComponent(mint)}`)
      .then((r) => r.json())
      .then((data: UltraMintInfo[] | { error: string }) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          const token = data.find((t) => t.id === mint) ?? data[0];
          setInfo(token ? mapUltraMintToResult(token) : null);
        } else {
          setInfo(null);
        }
      })
      .catch(() => { if (!cancelled) setInfo(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mint]);

  const name = info?.name ?? "Unknown";
  const symbol = info?.symbol ?? (mint === SOL_MINT ? "SOL" : "?");
  const decimals = info?.decimals ?? 6;
  const imageUrl = info?.logoURI ?? "";

  return {
    name,
    symbol,
    decimals,
    imageUrl,
    loading,
    tokenInfo: info,
  };
}

"use client";

import { SOL_MINT } from "@/lib/trading-constants";
import { useTokenInfoTrading } from "./use-token-info-trading";
import { useEffect, useState } from "react";

const LAMPORTS_PER_SOL = 1_000_000_000;

export function useTokenBalanceTrading(mint: string, walletAddress: string | null) {
  const { decimals } = useTokenInfoTrading(mint);
  const [balance, setBalance] = useState<string>("0");
  const [rawBalance, setRawBalance] = useState<bigint>(BigInt(0));

  useEffect(() => {
    if (!walletAddress || !mint) {
      setBalance("0");
      setRawBalance(BigInt(0));
      return;
    }
    let cancelled = false;
    if (mint === SOL_MINT) {
      fetch(`/api/solana/balance?wallet=${encodeURIComponent(walletAddress)}`)
        .then((r) => (r.ok ? r.json() : { value: 0 }))
        .then((data) => {
          if (cancelled) return;
          const lamports = data?.value ?? 0;
          setRawBalance(BigInt(lamports));
          setBalance((lamports / LAMPORTS_PER_SOL).toFixed(4));
        })
        .catch(() => {
          if (!cancelled) setBalance("0");
        });
      return;
    }
    fetch(
      `/api/tokens/balance?walletAddress=${encodeURIComponent(walletAddress)}&mintAddress=${encodeURIComponent(mint)}`
    )
      .then((r) => r.ok ? r.json() : { balance: { uiAmountString: "0" } })
      .then((data) => {
        if (cancelled) return;
        const ui = data?.balance?.uiAmountString ?? "0";
        setBalance(ui);
        const num = parseFloat(ui);
        setRawBalance(
          BigInt(
            Math.floor(
              (isNaN(num) ? 0 : num) * Math.pow(10, decimals ?? 6)
            )
          )
        );
      })
      .catch(() => {
        if (!cancelled) setBalance("0");
      });
    return () => {
      cancelled = true;
    };
  }, [mint, walletAddress, decimals]);

  return { balance, rawBalance };
}

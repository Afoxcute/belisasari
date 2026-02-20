"use client";

import type { UltraOrderResponse } from "@/lib/types/jupiter";
import { VersionedTransaction } from "@solana/web3.js";
const DEFAULT_SLIPPAGE_BPS = 50;
const PLATFORM_FEE_BPS = 0;
const FEE_ACCOUNT = "8jTiTDW9ZbMHvAD9SZWvhPfRx5gUgK7HACMdgbFp2tUz";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface UseJupiterSwapParams {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  inputDecimals: number;
  outputDecimals: number;
  walletAddress: string | null;
  wallet: { signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction> } | null;
  swapMode: string;
  /** Slippage (Ultra uses its own; we pass for display only; ExactOut not used for Ultra) */
  slippageBps?: number | "auto";
}

/** Jupiter Ultra Swap API: order (quote + tx) and execute. Supports all tokens on Ultra. */
export function useJupiterSwap({
  inputMint,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  outputMint,
  inputAmount,
  inputDecimals,
  outputDecimals,
  walletAddress,
  wallet,
  swapMode = "ExactIn",
}: UseJupiterSwapParams) {
  const { toast } = useToast();
  const [ultraOrder, setUltraOrder] = useState<UltraOrderResponse | null>(null);
  const [expectedOutput, setExpectedOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isQuoteRefreshing, setIsQuoteRefreshing] = useState(false);
  const [priceImpact, setPriceImpact] = useState("");
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuote = useCallback(async () => {
    if (
      !inputAmount ||
      Number(inputAmount) === 0 ||
      !inputMint ||
      !outputMint ||
      inputDecimals == null ||
      outputDecimals == null
    ) {
      setUltraOrder(null);
      setExpectedOutput("");
      setPriceImpact("");
      return;
    }
    try {
      if (ultraOrder) setIsQuoteRefreshing(true);
      const isExactOut = swapMode === "ExactOut";
      const amountRaw = Math.floor(
        Number(inputAmount) * Math.pow(10, isExactOut ? outputDecimals : inputDecimals)
      );
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: String(amountRaw),
      });
      if (walletAddress) params.set("taker", walletAddress);

      const res = await fetch(`/api/jupiter/ultra/order?${params.toString()}`);
      const data: UltraOrderResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Order failed");
      }

      setUltraOrder(data);
      setPriceImpact(data.priceImpactPct ?? String(data.priceImpact ?? ""));

      if (data.swapMode === "ExactIn" || swapMode === "ExactIn") {
        setExpectedOutput(
          (Number(data.outAmount) / Math.pow(10, outputDecimals)).toString()
        );
      } else {
        setExpectedOutput(
          (Number(data.inAmount) / Math.pow(10, inputDecimals)).toString()
        );
      }
    } catch (err) {
      console.error(err);
      setUltraOrder(null);
      setExpectedOutput("");
      setPriceImpact("");
    } finally {
      setIsQuoteRefreshing(false);
    }
  }, [
    inputAmount,
    inputMint,
    outputMint,
    inputDecimals,
    outputDecimals,
    swapMode,
    walletAddress,
    ultraOrder,
  ]);

  useEffect(() => {
    if (
      inputAmount &&
      Number(inputAmount) > 0 &&
      inputMint &&
      outputMint
    ) {
      fetchQuote();
    } else {
      setExpectedOutput("");
      setPriceImpact("");
      setUltraOrder(null);
    }
  }, [inputAmount, inputMint, outputMint, swapMode, fetchQuote]);

  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (
      inputAmount &&
      Number(inputAmount) > 0 &&
      inputMint &&
      outputMint &&
      !isQuoteRefreshing
    ) {
      refreshRef.current = setInterval(fetchQuote, 15000);
    }
    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    };
  }, [inputAmount, inputMint, outputMint, isQuoteRefreshing, fetchQuote]);

  const handleSwap = useCallback(async () => {
    if (!wallet || !walletAddress) {
      toast({ title: "Connect wallet to swap", variant: "destructive" });
      return;
    }
    const order = ultraOrder;
    if (!order?.requestId || !order?.transaction) {
      toast({
        title: order?.errorMessage ?? "Get a quote first",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const tx = VersionedTransaction.deserialize(
        Buffer.from(order.transaction, "base64")
      );
      const signed = await wallet.signTransaction(tx);
      const signedB64 = Buffer.from(signed.serialize()).toString("base64");

      const res = await fetch("/api/jupiter/ultra/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: order.requestId,
          signedTransaction: signedB64,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Execute failed");
      }

      if (data.status === "Success" && data.signature) {
        toast({
          title: "Swap successful",
          description: data.signature,
        });
        setUltraOrder(null);
        setExpectedOutput("");
      } else {
        toast({
          title: data.status === "Failed" ? "Swap failed" : "Swap submitted",
          description: data.signature ?? data.error,
          variant: data.status === "Failed" ? "destructive" : undefined,
        });
        if (data.status === "Failed") {
          setUltraOrder(null);
          setExpectedOutput("");
        }
      }
    } catch (e) {
      toast({
        title: "Swap failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [wallet, walletAddress, ultraOrder, toast]);

  return {
    loading,
    expectedOutput,
    isQuoteRefreshing,
    priceImpact,
    handleSwap,
    fetchQuote,
  };
}

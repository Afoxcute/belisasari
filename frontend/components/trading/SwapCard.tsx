"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useJupiterSwap } from "@/hooks/use-jupiter-swap";
import { useTokenInfoTrading } from "@/hooks/use-token-info-trading";
import { useTokenBalanceTrading } from "@/hooks/use-token-balance-trading";
import { useSwapStore } from "@/store/use-swap-store";
import { ESwapMode } from "@/lib/types/jupiter";
import { SOL_MINT } from "@/lib/trading-constants";
import { useSolanaWallets } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { SwapPay } from "./SwapPay";
import { SwapReceive } from "./SwapReceive";
import { TokenSearchDialog } from "./TokenSearchDialog";
import { SlippageSettings } from "./SlippageSettings";

function formatUsd(val: number): string {
  if (val !== 0 && Math.abs(val) < 0.01) return "$" + val.toFixed(4);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

function formatAmount(num: number, decimals: number): string {
  if (num !== 0 && Math.abs(num) < 0.0001) return num.toExponential(2);
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

export function SwapCard() {
  const { walletAddress } = useCurrentWallet();
  const { wallets } = useSolanaWallets();
  const wallet = wallets?.[0] ?? null;
  const { inputs, setInputs } = useSwapStore();
  const [inputMint, setInputMint] = useState(inputs.inputMint || SOL_MINT);
  const [outputMint, setOutputMint] = useState(inputs.outputMint || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const [inAmount, setInAmount] = useState("");
  const [outAmount, setOutAmount] = useState("");
  const [swapMode, setSwapMode] = useState<ESwapMode>(ESwapMode.EXACT_IN);
  const [slippageBps, setSlippageBps] = useState<number | "auto">(50);
  const [showInputSearch, setShowInputSearch] = useState(false);
  const [showOutputSearch, setShowOutputSearch] = useState(false);

  const inputToken = useTokenInfoTrading(inputMint);
  const outputToken = useTokenInfoTrading(outputMint);
  const { balance: inputBalance, rawBalance: inputRawBalance } = useTokenBalanceTrading(inputMint, walletAddress);

  const { loading, expectedOutput, isQuoteRefreshing, priceImpact, handleSwap } = useJupiterSwap({
    inputMint,
    outputMint,
    inputAmount: swapMode === ESwapMode.EXACT_IN ? inAmount : outAmount,
    inputDecimals: swapMode === ESwapMode.EXACT_IN ? inputToken.decimals : outputToken.decimals,
    outputDecimals: swapMode === ESwapMode.EXACT_OUT ? inputToken.decimals : outputToken.decimals,
    walletAddress,
    wallet,
    swapMode,
    slippageBps,
  });

  const displayIn = useMemo(() => {
    if (isQuoteRefreshing && swapMode === ESwapMode.EXACT_OUT) return "...";
    return inAmount === "" ? "" : swapMode === ESwapMode.EXACT_IN ? inAmount : formatAmount(parseFloat(inAmount), inputToken.decimals);
  }, [inAmount, swapMode, isQuoteRefreshing, inputToken.decimals]);

  const displayOut = useMemo(() => {
    if (isQuoteRefreshing && swapMode === ESwapMode.EXACT_IN) return "...";
    return outAmount === "" ? "" : swapMode === ESwapMode.EXACT_OUT ? outAmount : formatAmount(parseFloat(outAmount), outputToken.decimals);
  }, [outAmount, swapMode, isQuoteRefreshing, outputToken.decimals]);

  const inUsd = useMemo(() => {
    const num = parseFloat(inAmount);
    if (isNaN(num)) return "$0.00";
    return formatUsd(num * 0);
  }, [inAmount]);

  const outUsd = useMemo(() => {
    const num = parseFloat(outAmount);
    if (isNaN(num)) return "$0.00";
    return formatUsd(num * 0);
  }, [outAmount]);

  const handleInAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || v === "." || /^[0-9]*\.?[0-9]*$/.test(v)) setInAmount(v);
  };

  const handleOutAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || v === "." || /^[0-9]*\.?[0-9]*$/.test(v)) setOutAmount(v);
  };


  const handleInputTokenSelect = (t: { address: string; symbol: string; name: string; decimals: number }) => {
    setInputMint(t.address);
    setInputs({ inputMint: t.address, outputMint, inputAmount: parseFloat(inAmount) || 0 });
  };

  const handleOutputTokenSelect = (t: { address: string; symbol: string; name: string; decimals: number }) => {
    setOutputMint(t.address);
    setInputs({ inputMint, outputMint: t.address, inputAmount: parseFloat(inAmount) || 0 });
  };

  const handleSwapDirection = () => {
    setInputMint(outputMint);
    setOutputMint(inputMint);
    setInAmount(outAmount);
    setOutAmount(inAmount);
    setInputs({ inputMint: outputMint, outputMint: inputMint, inputAmount: parseFloat(outAmount) || 0 });
  };

  useEffect(() => {
    if (typeof expectedOutput !== "string") return;
    if (swapMode === ESwapMode.EXACT_IN) setOutAmount(expectedOutput);
    else setInAmount(expectedOutput);
  }, [expectedOutput, swapMode]);

  const handlePercent = (p: number) => {
    if (!inputRawBalance || inputToken.decimals == null) return;
    const divisor = BigInt(100 / p);
    const raw = inputRawBalance / divisor;
    const val = Number(raw) / Math.pow(10, inputToken.decimals);
    setInAmount(val.toFixed(Math.min(9, inputToken.decimals)));
  };

  const canSwap = wallet && walletAddress && inAmount && Number(inAmount) > 0 && expectedOutput;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-iris-primary">Swap</h2>
          <SlippageSettings slippageBps={slippageBps} onSlippageChange={setSlippageBps} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SwapPay
          inputTokenSymbol={inputToken.symbol}
          inputTokenImageUri={inputToken.imageUrl}
          displayInAmount={displayIn}
          displayInAmountUsd={inUsd}
          balance={inputBalance}
          onAmountChange={handleInAmountChange}
          onTokenClick={() => setShowInputSearch(true)}
          onFocus={() => setSwapMode(ESwapMode.EXACT_IN)}
          onPercent={handlePercent}
        />

        <div className="flex items-center justify-center">
          <button
            type="button"
            className="p-2 rounded-full border bg-card hover:bg-muted"
            onClick={handleSwapDirection}
            aria-label="Swap direction"
          >
            <ArrowDownUp className="h-5 w-5" />
          </button>
        </div>

        <SwapReceive
          outputTokenSymbol={outputToken.symbol}
          outputTokenImageUri={outputToken.imageUrl}
          displayOutAmount={displayOut}
          displayOutAmountUsd={outUsd}
          onAmountChange={handleOutAmountChange}
          onTokenClick={() => setShowOutputSearch(true)}
          onFocus={() => setSwapMode(ESwapMode.EXACT_OUT)}
        />

        {priceImpact && (
          <p className="text-xs text-muted-foreground">Price impact: {priceImpact}%</p>
        )}

        <Button
          className="w-full bg-iris-primary hover:bg-iris-primary/90"
          size="lg"
          disabled={!canSwap || loading}
          onClick={handleSwap}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Swap"}
        </Button>
        {!walletAddress && (
          <p className="text-center text-sm text-muted-foreground">Connect wallet to swap</p>
        )}
      </CardContent>

      <TokenSearchDialog open={showInputSearch} onClose={() => setShowInputSearch(false)} onSelect={handleInputTokenSelect} />
      <TokenSearchDialog open={showOutputSearch} onClose={() => setShowOutputSearch(false)} onSelect={handleOutputTokenSelect} />
    </Card>
  );
}

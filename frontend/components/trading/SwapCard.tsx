"use client";

import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useJupiterSwap } from "@/hooks/use-jupiter-swap";
import { useTokenInfoTrading } from "@/hooks/use-token-info-trading";
import { useTokenBalanceTrading } from "@/hooks/use-token-balance-trading";
import { useSwapStore } from "@/store/use-swap-store";
import { ESwapMode } from "@/lib/types/jupiter";
import { SOL_MINT } from "@/lib/trading-constants";
import { useSolanaWallets } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Loader2, Settings2 } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false);

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

  const canSwap = !!(wallet && walletAddress && inAmount && Number(inAmount) > 0 && expectedOutput);

  return (
    <div className="w-full bg-card-bg border border-border-light rounded-3xl p-2 relative shadow-2xl">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#00D4FF]/30 to-transparent"></div>
      
      <div className="px-4 py-3 flex items-center justify-between mb-1">
        <div className="flex gap-4">
          <button className="text-text-main font-semibold text-[15px] relative">
            Swap
            <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#00D4FF] rounded-t-full"></div>
          </button>
          <button className="text-[#6B7280] font-medium text-[15px] hover:text-text-main transition-colors">
            Limit
          </button>
          <button className="text-[#6B7280] font-medium text-[15px] hover:text-text-main transition-colors">
            DCA
          </button>
        </div>
        <div className="relative">
          <button 
            className={`p-2 rounded-full hover:bg-foreground/5 transition-colors ${showSettings ? 'text-text-main bg-foreground/5' : 'text-[#6B7280]'}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </button>
          {showSettings && (
            <div className="absolute right-0 top-full mt-2 z-20 bg-card-bg border border-border-light rounded-xl p-4 shadow-xl min-w-[240px]">
              <SlippageSettings slippageBps={slippageBps} onSlippageChange={(val) => {
                setSlippageBps(val);
                setShowSettings(false);
              }} />
            </div>
          )}
        </div>
      </div>

      <div className="p-1 space-y-1 relative">
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

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group">
          <div className="bg-card-bg p-1 rounded-full">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-foreground/5 border border-border-light flex items-center justify-center text-text-main hover:bg-foreground/10 hover:border-[#00D4FF]/30 transition-all group-hover:rotate-180 duration-300"
              onClick={handleSwapDirection}
              aria-label="Swap direction"
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
          </div>
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
      </div>

      {priceImpact && Number(priceImpact) > 1 && (
        <div className="px-4 py-3 mt-2 mx-1 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-xl flex items-center justify-between">
          <span className="text-[#FF3B3B] text-[13px] font-medium">Price Impact Warning</span>
          <span className="text-[#FF3B3B] text-[13px] font-bold">{priceImpact}%</span>
        </div>
      )}

      <div className="p-1 mt-1">
        <button
          className="w-full h-14 rounded-2xl bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold text-[16px] flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canSwap || loading}
          onClick={handleSwap}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Routing...</span>
            </div>
          ) : !walletAddress ? (
            "Connect Wallet"
          ) : !inAmount || Number(inAmount) === 0 ? (
            "Enter Amount"
          ) : (
            "Swap"
          )}
        </button>
      </div>

      <TokenSearchDialog open={showInputSearch} onClose={() => setShowInputSearch(false)} onSelect={handleInputTokenSelect} />
      <TokenSearchDialog open={showOutputSearch} onClose={() => setShowOutputSearch(false)} onSelect={handleOutputTokenSelect} />
    </div>
  );
}

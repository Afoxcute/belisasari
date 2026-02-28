"use client";

import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface SwapReceiveProps {
  outputTokenSymbol: string;
  outputTokenImageUri: string;
  displayOutAmount: string;
  displayOutAmountUsd: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTokenClick: () => void;
  onFocus: () => void;
}

export function SwapReceive(props: SwapReceiveProps) {
  const {
    outputTokenSymbol,
    outputTokenImageUri,
    displayOutAmount,
    displayOutAmountUsd,
    onAmountChange,
    onTokenClick,
    onFocus,
  } = props;
  return (
    <div className="bg-white/[0.03] border border-border-light rounded-[20px] p-4 hover:border-border-light transition-colors">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[13px] font-medium text-[#6B7280]">You receive</span>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="0"
            className="w-full text-[32px] sm:text-[40px] font-semibold text-text-main bg-transparent border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-text-main/20 select-all"
            value={displayOutAmount}
            onChange={onAmountChange}
            onFocus={onFocus}
            style={{ boxShadow: 'none' }}
          />
          <div className="text-[13px] font-medium text-[#6B7280] mt-1 ml-1">{displayOutAmountUsd !== "$0.00" ? displayOutAmountUsd : ""}</div>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 bg-[#1A1A24] hover:bg-[#252532] border border-border-light rounded-full pl-2 pr-3 py-1.5 transition-colors shrink-0"
          onClick={onTokenClick}
        >
          {outputTokenImageUri ? (
            <img src={(outputTokenImageUri)} width={26} height={26} alt={outputTokenSymbol} className="rounded-full" />
          ) : (
            <div className="w-[26px] h-[26px] rounded-full bg-foreground/10 flex items-center justify-center text-[10px] text-text-main">
              {outputTokenSymbol.slice(0,2)}
            </div>
          )}
          <span className="font-bold text-[15px] text-text-main tracking-tight">{outputTokenSymbol}</span>
          <ChevronDown className="h-4 w-4 text-[#6B7280] ml-1" />
        </button>
      </div>

      <div className="h-[26px]"></div> {/* Spacer for symmetry with SwapPay max buttons */}
    </div>
  );
}

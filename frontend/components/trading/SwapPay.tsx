"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface SwapPayProps {
  inputTokenSymbol: string;
  inputTokenImageUri: string;
  displayInAmount: string;
  displayInAmountUsd: string;
  balance: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTokenClick: () => void;
  onFocus: () => void;
  onPercent: (p: number) => void;
}

export function SwapPay({
  inputTokenSymbol,
  inputTokenImageUri,
  displayInAmount,
  displayInAmountUsd,
  balance,
  onAmountChange,
  onTokenClick,
  onFocus,
  onPercent,
}: SwapPayProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">You pay</span>
        <span className="text-muted-foreground">Balance: {balance}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="0.00"
          className="text-xl border-0 bg-transparent px-0 focus-visible:ring-0"
          value={displayInAmount}
          onChange={onAmountChange}
          onFocus={onFocus}
        />
        <span className="text-sm text-muted-foreground">{displayInAmountUsd}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between h-12"
        onClick={onTokenClick}
      >
        <div className="flex items-center gap-2">
          {inputTokenImageUri ? (
            <Image
              src={inputTokenImageUri}
              alt=""
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted" />
          )}
          <span>{inputTokenSymbol}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>
      <div className="flex gap-2 justify-end">
        {[25, 50, 100].map((p) => (
          <Button
            key={p}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPercent(p)}
          >
            {p === 100 ? "Max" : `${p}%`}
          </Button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
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
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">You receive</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="0.00"
          className="text-xl border-0 bg-transparent px-0 focus-visible:ring-0"
          value={displayOutAmount}
          onChange={onAmountChange}
          onFocus={onFocus}
        />
        <span className="text-sm text-muted-foreground">{displayOutAmountUsd}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between h-12"
        onClick={onTokenClick}
      >
        <div className="flex items-center gap-2">
          {outputTokenImageUri ? (
            <Image src={outputTokenImageUri} alt="" width={24} height={24} className="rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted" />
          )}
          <span>{outputTokenSymbol}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

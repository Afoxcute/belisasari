"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const SLIPPAGE_OPTIONS = [
  { label: "0.1%", value: 10 },
  { label: "0.5%", value: 50 },
  { label: "1%", value: 100 },
  { label: "2%", value: 200 },
  { label: "Auto", value: "auto" },
];

interface SlippageSettingsProps {
  slippageBps: number | "auto";
  onSlippageChange: (value: number | "auto") => void;
}

export function SlippageSettings({
  slippageBps,
  onSlippageChange,
}: SlippageSettingsProps) {
  const value =
    slippageBps === "auto"
      ? "auto"
      : String(SLIPPAGE_OPTIONS.find((o) => o.value === slippageBps)?.value ?? 50);

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-text-main text-[13px] font-semibold tracking-wide uppercase">
        Max Slippage
      </Label>
      <Select
        value={value}
        onValueChange={(v) =>
          onSlippageChange(v === "auto" ? "auto" : Number(v))
        }
      >
        <SelectTrigger className="w-full bg-foreground/5 border border-border-light rounded-xl h-11 text-[14px] text-text-main focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A24] border border-border-light rounded-xl shadow-2xl text-text-main">
          {SLIPPAGE_OPTIONS.map((o) => (
            <SelectItem 
              key={String(o.value)} 
              value={String(o.value)}
              className="hover:bg-foreground/5 focus:bg-foreground/10 focus:text-text-main cursor-pointer rounded-lg mx-1 my-0.5"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
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
    <div className="flex items-center gap-2">
      <Label className="text-muted-foreground text-sm whitespace-nowrap">
        Slippage
      </Label>
      <Select
        value={value}
        onValueChange={(v) =>
          onSlippageChange(v === "auto" ? "auto" : Number(v))
        }
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SLIPPAGE_OPTIONS.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

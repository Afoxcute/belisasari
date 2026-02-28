"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ITokenSearchResult } from "@/lib/types/jupiter";
import type { TokenListCategory } from "@/hooks/use-token-search-trading";
import Image from "next/image";
import Link from "next/link";
import { LineChart, Search, X } from "lucide-react";
import { useTokenSearchTrading } from "@/hooks/use-token-search-trading";
import { useEffect, useState } from "react";

const CATEGORIES: { value: TokenListCategory; label: string }[] = [
  { value: "verified", label: "Strict" },
  { value: "trending", label: "Trending" },
  { value: "toptraded", label: "Top" },
  { value: "toporganic", label: "Organic" },
];

type OnSelect = (token: { address: string; symbol: string; name: string; decimals: number }) => void;

export function TokenSearchDialog(props: {
  open: boolean;
  onClose: () => void;
  onSelect: OnSelect;
}) {
  const { open, onClose, onSelect } = props;
  const {
    setSearchQuery,
    searchResults,
    isLoading,
    category,
    setCategory,
  } = useTokenSearchTrading();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    setSearchQuery(query);
  }, [query, setSearchQuery]);

  const handleSelect = (t: ITokenSearchResult) => {
    onSelect({
      address: t.address,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-card-bg border border-border-light rounded-2xl p-0 overflow-hidden text-text-main gap-0 shadow-2xl [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Tokens</DialogTitle>
          <DialogDescription>Search for a token to select it.</DialogDescription>
        </DialogHeader>
        <div className="p-4 border-b border-border-light space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Select Token</h2>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-foreground/5 text-[#6B7280] hover:text-text-main transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <Input
              placeholder="Search by name, symbol, or address"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-foreground/5 border border-border-light rounded-xl pl-10 pr-4 h-11 text-[15px] focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] placeholder:text-[#6B7280] text-text-main"
            />
          </div>
          
          {!query.trim() && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory(c.value);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                    category === c.value
                      ? "bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30"
                      : "bg-foreground/5 text-[#6B7280] border border-transparent hover:bg-foreground/10 hover:text-text-main"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="max-h-[400px] min-h-[300px] overflow-y-auto p-2">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-[200px] text-[#6B7280]">
              <div className="w-8 h-8 border-2 border-border-light border-t-[#00D4FF] rounded-full animate-spin mb-3"></div>
              <p className="text-[13px]">Searching tokens...</p>
            </div>
          )}
          
          {!isLoading && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[200px] text-[#6B7280]">
              <Search className="w-8 h-8 opacity-20 mb-3" />
              <p className="text-[13px]">No tokens found.</p>
            </div>
          )}

          {!isLoading && searchResults.slice(0, 80).map((t) => (
            <div
              key={t.address}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer group transition-colors"
              onClick={() => handleSelect(t)}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {t.logoURI ? (
                  <img src={(t.logoURI)} alt={t.symbol} width={36} height={36} className="rounded-full shrink-0 border border-border-light" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center text-[10px] text-[#6B7280] border border-border-light shrink-0">
                    {t.symbol.slice(0,2)}
                  </div>
                )}
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[15px] text-text-main truncate group-hover:text-[#00D4FF] transition-colors">{t.symbol}</span>
                    {t.verified && (
                      <span className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-[#00FF88]/20 text-[#00FF88] text-[9px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#6B7280] truncate">{t.name}</span>
                </div>
              </div>
              
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/trading/token/${t.address}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-[#6B7280] hover:bg-foreground/10 hover:text-text-main transition-colors"
                  title="View chart"
                >
                  <LineChart className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

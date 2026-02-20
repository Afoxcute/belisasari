"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ITokenSearchResult } from "@/lib/types/jupiter";
import type { TokenListCategory } from "@/hooks/use-token-search-trading";
import Image from "next/image";
import { useTokenSearchTrading } from "@/hooks/use-token-search-trading";
import { useEffect, useState } from "react";

const CATEGORIES: { value: TokenListCategory; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "trending", label: "Trending" },
  { value: "recent", label: "Recent" },
  { value: "toptraded", label: "Top traded" },
  { value: "toporganic", label: "Organic" },
  { value: "lst", label: "LST" },
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select token</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search by name, symbol, or address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2"
        />
        {!query.trim() && (
          <div className="flex flex-wrap gap-1 mb-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory(c.value);
                }}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  category === c.value
                    ? "bg-iris-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <div className="max-h-[320px] overflow-y-auto space-y-1">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {!isLoading &&
            searchResults.slice(0, 80).map((t) => (
              <button
                key={t.address}
                type="button"
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
                onClick={() => handleSelect(t)}
              >
                {t.logoURI ? (
                  <Image
                    src={t.logoURI}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium flex items-center gap-1">
                    {t.symbol}
                    {t.verified && (
                      <span className="text-xs text-muted-foreground">✓</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {t.name}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { DEFAULT_TOKENS } from "@/lib/trading-constants";
import type { ITokenSearchResult } from "@/lib/types/jupiter";
import type { UltraMintInfo } from "@/lib/types/jupiter";
import { useCallback, useEffect, useState } from "react";

function mapUltraToResult(m: UltraMintInfo): ITokenSearchResult {
  return {
    address: m.id,
    symbol: m.symbol ?? "?",
    name: m.name ?? "Unknown",
    decimals: m.decimals ?? 6,
    logoURI: m.icon ?? undefined,
    price: m.usdPrice ?? undefined,
    market_cap: m.mcap ?? undefined,
    verified: m.isVerified ?? undefined,
  };
}

export type TokenListCategory = "verified" | "trending" | "recent" | "toptraded" | "toporganic" | "lst";

/** Token selector: Tokens V2 lists (verified, trending, recent, etc.) + Ultra Search for user query. */
export function useTokenSearchTrading() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ITokenSearchResult[]>(DEFAULT_TOKENS);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<TokenListCategory>("verified");

  /** Load a Tokens V2 list (verified, trending, recent, etc.) */
  const loadList = useCallback(async (list: TokenListCategory) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jupiter/tokens/list?list=${list}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : DEFAULT_TOKENS);
    } catch {
      setResults(DEFAULT_TOKENS);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Search via Jupiter Ultra Search */
  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      loadList(category);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/jupiter/ultra/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data.map((m: UltraMintInfo) => mapUltraToResult(m)));
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [category, loadList]);

  /** When query changes: if empty, load category list; else run Ultra search */
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      loadList(category);
    } else {
      const t = setTimeout(() => search(q), 300);
      return () => clearTimeout(t);
    }
  }, [searchQuery, category, loadList, search]);

  /** Set category and refresh (e.g. switch to Trending); leaves query unchanged */
  const setCategoryAndRefresh = useCallback((list: TokenListCategory) => {
    setCategory(list);
    setSearchQuery("");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults: results,
    isLoading: loading,
    category,
    setCategory: setCategoryAndRefresh,
    loadList,
  };
}

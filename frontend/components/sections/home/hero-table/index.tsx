"use client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import React, { useEffect, useMemo, useState } from "react";
import {
  IPFS_GATEWAY_URL,
  ITEMS_PER_PAGE,
} from "@/lib/constants";
import { LeaderboardData, SortConfig, SortKey } from "@/lib/types";
import { useEnvironmentStore } from "@/components/context";
import Image from "next/image";
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HeroTable() {
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesFetched, setImagesFetched] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [isClient, setIsClient] = useState(false);
  const { setLeaderboard, leaderboard, paid } = useEnvironmentStore(
    (store) => store
  );

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  useEffect(() => {
    // Only fetch data after we're on the client side
    if (!isClient) return;
    
    let isMounted = true;

    (async function () {
      if (!isMounted) return;
      setLeaderboard([]);
      console.log("FETCHING DATA");

      try {
        const countResponse = await fetch("/api/supabase/get-count");
        const countData = await countResponse.json();
        const dataCount = countData.count;

        if (!isMounted) return;
        setTotalPages(
          Math.ceil((dataCount || ITEMS_PER_PAGE) / ITEMS_PER_PAGE)
        );

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const memecoinsResponse = await fetch(
          `/api/supabase/get-memecoins?start=${startIndex}`
        );

        const tempMemecoins = await memecoinsResponse.json();
        if (tempMemecoins.error) {
          console.log("ERROR FETCHING MEMECOINS");
          return;
        }

        if (!isMounted) return;
        setLeaderboard(tempMemecoins);
        setImagesFetched(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isClient, currentPage, setLeaderboard]);

  useEffect(() => {
    if (leaderboard.length > 0 && !imagesFetched) {
      Promise.all(
        leaderboard.map(async (coin) => {
          console.log(coin.uri);
          const metadataResponse = await fetch(
            IPFS_GATEWAY_URL + coin.uri.split("/").at(-1)
          );
          const metadata = await metadataResponse.json();
          coin.image = IPFS_GATEWAY_URL + metadata.image.split("/").at(-1);
        })
      ).then(() => {
        setImagesFetched(true);
      });
    }
  }, [imagesFetched, leaderboard]);
  const groupedTokens = useMemo(() => {
    const groups: Record<string, LeaderboardData[]> = {};
    leaderboard.forEach((token) => {
      const symbol = token.symbol.toUpperCase();
      if (!groups[symbol]) {
        groups[symbol] = [];
      }
      groups[symbol].push(token);
    });
    return groups;
  }, [leaderboard]);
  const getGroupRepresentative = (tokens: LeaderboardData[]) => {
    return tokens.reduce((prev, current) =>
      (current.latest_market_cap || 0) > (prev.latest_market_cap || 0)
        ? current
        : prev
    );
  };

  const toggleGroup = (symbol: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  // Helper to generate a stable pseudo-random trend for visual mockup without altering API
  const getSimulatedTrend = (id: number) => {
    const raw = (id * 137) % 30 - 10; 
    return Number(raw.toFixed(2));
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6 relative">
        <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
        <h2 className="text-[18px] font-semibold text-text-main">Top Mentioned Tokens</h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="w-full max-w-[1200px] mx-auto mt-12 mb-24">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#111118] border-t-[#00D4FF] rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="w-full bg-card-bg border border-border-light rounded-xl relative overflow-hidden">
          {/* Top cyan gradient accent */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#00D4FF]/40 to-transparent"></div>
          
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-[#6B7280] font-medium w-16">Rank</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-[#6B7280] font-medium">Token</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-[#6B7280] font-medium text-right">Mentions</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-[#6B7280] font-medium text-right">24H Trend</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-[#6B7280] font-medium text-right">Source</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedTokens).map(([symbol, tokens], idx) => {
                  const rep = getGroupRepresentative(tokens);
                  const trend = getSimulatedTrend(rep.id);
                  const isPositive = trend >= 0;
                  const totalMentions = tokens.reduce((sum, t) => sum + (t.mentions || 0), 0);

                  return (
                    <React.Fragment key={symbol}>
                      {/* Group Header Row */}
                      <tr
                        className={`group h-[52px] cursor-pointer transition-colors hover:bg-[#1A1A24] border-l-2 border-transparent hover:border-l-[#00D4FF] ${idx % 2 === 1 ? 'bg-white/[0.03]' : ''}`}
                        onClick={() => {
                          if (tokens.length > 1) {
                            toggleGroup(symbol);
                          } else {
                            router.push(`/token/${tokens[0].id}`);
                          }
                        }}
                      >
                        <td className="px-6 py-0">
                          <div className="flex items-center gap-2">
                            {tokens.length > 1 ? (
                              <div className="text-[#6B7280] hover:text-text-main transition-colors">
                                {expandedGroups.has(symbol) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            ) : (
                              <div className="w-4" />
                            )}
                            <span className="text-[14px] text-[#6B7280] font-medium">{idx + 1}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-0 flex items-center gap-3 h-[52px]">
                          {imagesFetched ? (
                            <img src={rep.image || "/solana.png"} alt={symbol} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-foreground/10 animate-pulse" />
                          )}
                          <div className="flex flex-col justify-center">
                            <span className="text-[15px] font-bold text-text-main leading-tight">{symbol}</span>
                            <span className="text-[12px] text-[#6B7280] leading-tight">${symbol.toLowerCase()} {tokens.length > 1 && `(${tokens.length})`}</span>
                          </div>
                        </td>

                        <td className="px-6 py-0 text-right">
                          <span className="text-[15px] font-bold text-text-main">{totalMentions.toLocaleString()}</span>
                        </td>

                        <td className="px-6 py-0 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* Tiny Sparkline Mock */}
                            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {isPositive ? (
                                <path d="M0 14L8 10L16 12L24 6L32 8L40 2" stroke="#00FF88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              ) : (
                                <path d="M0 2L8 6L16 4L24 10L32 8L40 14" stroke="#FF3B3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              )}
                            </svg>
                            <div className={`px-2.5 py-1 rounded-full text-[13px] font-bold whitespace-nowrap ${isPositive ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-[#FF3B3B]/20 text-[#FF3B3B]'}`}>
                              {isPositive ? '+' : ''}{trend}%
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-0 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-[18px] h-[18px] flex items-center justify-center rounded-sm bg-card-bg">
                              <svg viewBox="0 0 24 24" fill="#FF0050" className="w-[14px] h-[14px]"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                            </div>
                            <div className="w-[18px] h-[18px] flex items-center justify-center rounded-sm bg-card-bg">
                              <svg viewBox="0 0 24 24" fill="#229ED9" className="w-[14px] h-[14px]"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.06-.2-1.58-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/></svg>
                            </div>
                            <div className="w-[18px] h-[18px] flex items-center justify-center rounded-sm bg-card-bg">
                              <svg viewBox="0 0 24 24" fill="white" className="w-[14px] h-[14px]"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Group Rows */}
                      {expandedGroups.has(symbol) &&
                        tokens.length > 1 &&
                        tokens.map((token) => {
                          const subTrend = getSimulatedTrend(token.id);
                          const isSubPositive = subTrend >= 0;
                          return (
                            <tr
                              key={token.id}
                              className="group h-[52px] cursor-pointer bg-white/[0.02] hover:bg-[#1A1A24] border-l-2 border-transparent hover:border-l-[#00D4FF]"
                              onClick={() => router.push(`/token/${token.id}`)}
                            >
                              <td className="px-6 py-0"></td>
                              <td className="px-6 py-0 flex items-center gap-3 h-[52px] pl-[52px]">
                                {imagesFetched ? (
                                  <img src={token.image || "/solana.png"} alt={token.symbol} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-foreground/10 animate-pulse" />
                                )}
                                <span className="text-[13px] text-[#6B7280] font-medium leading-tight">{token.symbol}</span>
                              </td>
                              <td className="px-6 py-0 text-right">
                                <span className="text-[14px] font-bold text-text-main">{(token.mentions || 0).toLocaleString()}</span>
                              </td>
                              <td className="px-6 py-0 text-right">
                                <div className="flex items-center justify-end gap-3 opacity-60">
                                  <div className={`px-2 py-0.5 rounded text-[12px] font-bold whitespace-nowrap ${isSubPositive ? 'text-[#00FF88]' : 'text-[#FF3B3B]'}`}>
                                    {isSubPositive ? '+' : ''}{subTrend}%
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-0 text-right">
                                <span className="text-[12px] text-[#6B7280]">Linked</span>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paid && (
        <div className="flex justify-between items-center mt-6 px-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 h-9 bg-transparent"
          >
            Previous
          </Button>

          <span className="text-[13px] text-[#6B7280] font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 h-9 bg-transparent"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

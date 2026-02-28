"use client";

import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useZerionPortfolio } from "@/hooks/use-zerion-portfolio";
import { useAppAuth } from "@/components/provider/PrivyAppAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  History,
  RefreshCw,
  BarChart3,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { useTwitterPost } from "@/hooks/use-twitter-post";
import { useOpenAIInsight } from "@/hooks/use-openai-insight";
import type { ZerionPortfolioAttributes, ZerionPosition, ZerionTransaction } from "@/lib/zerion";

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${Math.abs(value) < 0.01 ? value.toFixed(4) : value.toFixed(2)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PortfolioPage() {
  const { walletAddress, walletIsConnected } = useCurrentWallet();
  const { ready, authenticated, login } = useAppAuth();
  const { portfolio, chart, positions, transactions, loading, error, refetch } =
    useZerionPortfolio(walletAddress);
  const { post: postTweet, posting: twitterPosting } = useTwitterPost();
  const { insight: aiInsight, loading: aiLoading, error: aiError, fetchInsight } = useOpenAIInsight();

  const chartData = useMemo(() => {
    const attrs = chart?.data?.attributes;
    const points = attrs?.points as [number, number][] | undefined;
    if (!Array.isArray(points) || points.length === 0) return [];
    return points.map((p) => {
      const ts = typeof p[0] === "number" ? p[0] : 0;
      const balance = typeof p[1] === "number" ? p[1] : 0;
      return {
        time: new Date(ts * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        timestamp: ts,
        value: balance,
      };
    });
  }, [chart]);

  const totalValue = portfolio?.data?.attributes?.total?.positions ?? 0;
  const changes = portfolio?.data?.attributes?.changes;
  const percent1d = changes?.percent_1d ?? 0;
  const abs1d = changes?.absolute_1d ?? 0;
  const distribution = portfolio?.data?.attributes?.positions_distribution_by_type;
  const positionList: ZerionPosition[] = positions?.data ?? [];
  const txList: ZerionTransaction[] = transactions?.data ?? [];

  const walletPositions = positionList.filter(
    (p) => !p.attributes?.position_type || p.attributes.position_type === "wallet"
  );
  const defiPositions = positionList.filter(
    (p) => p.attributes?.position_type && p.attributes.position_type !== "wallet"
  );

  if (!walletIsConnected) {
    return (
      <div className="min-h-screen bg-background-main pt-12">
        <div className="container mx-auto p-6 max-w-2xl text-center">
          <div className="bg-card-bg border border-border-light rounded-xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-6 w-6 text-[#00D4FF]" />
            </div>
            <h1 className="text-[24px] font-bold text-text-main mb-2">Portfolio Tracking (Zerion)</h1>
            <p className="text-[#6B7280] text-[15px] mb-8">
              Connect your wallet to view performance charts, token balances, DeFi positions, and transaction history.
            </p>
            <Button
              className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold px-8 h-11 border-none"
              onClick={() => ready && !authenticated && login({ loginMethods: ["wallet"], walletChainType: "solana-only" })}
            >
              <Image src="/solana.png" width={20} height={20} className="rounded-full mr-2" alt="Solana" />
              Connect wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main py-8 text-text-main">
      <div className="container mx-auto px-6 space-y-8 max-w-[1200px]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-light pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
              <h1 className="text-[24px] font-bold text-text-main tracking-tight flex items-center gap-2">
                Portfolio Insight
              </h1>
            </div>
            <p className="text-[#6B7280] text-[14px]">
              Wallet performance, token balances, DeFi positions, and transaction history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-border-light text-text-main hover:bg-foreground/5 h-9"
              onClick={() =>
                postTweet(
                  "Just checked my Solana portfolio on Belisasari (Zerion). #Belisasari #Solana #Portfolio"
                )
              }
              disabled={twitterPosting}
            >
              {twitterPosting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-transparent border-border-light text-[#00D4FF] hover:bg-[#00D4FF]/10 hover:text-[#00D4FF] h-9"
              onClick={() => refetch()} 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-xl p-4 flex items-start gap-3">
            <div className="min-w-0">
              <p className="text-[#FF3B3B] text-[14px] font-medium">{error}</p>
              <p className="text-[#FF3B3B]/70 text-[12px] mt-1">
                Add ZERION_API_KEY to your server environment to enable Zerion. Get a key at{" "}
                <a
                  href="https://dashboard.zerion.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-text-main font-semibold"
                >
                  dashboard.zerion.io
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card-bg border border-border-light rounded-xl p-5 hover:border-border-light transition-all">
            <p className="text-[13px] text-[#6B7280] uppercase tracking-wider font-semibold mb-2">Total Value</p>
            {loading && !portfolio ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#00D4FF]" />
            ) : (
              <h2 className="text-[32px] font-bold text-text-main tracking-tight">{formatUsd(totalValue)}</h2>
            )}
          </div>
          
          <div className="bg-card-bg border border-border-light rounded-xl p-5 hover:border-border-light transition-all">
            <p className="text-[13px] text-[#6B7280] uppercase tracking-wider font-semibold mb-2">24h Change</p>
            {loading && !portfolio ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#00D4FF]" />
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-[28px] font-bold flex items-center gap-1 ${percent1d >= 0 ? "text-[#00FF88]" : "text-[#FF3B3B]"}`}>
                  {percent1d >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                  {percent1d >= 0 ? "+" : ""}{percent1d.toFixed(2)}%
                </span>
                <span className="text-[14px] text-[#6B7280] font-medium ml-2">({formatUsd(abs1d)})</span>
              </div>
            )}
          </div>

          <div className="bg-card-bg border border-border-light rounded-xl p-5 hover:border-border-light transition-all">
            <p className="text-[13px] text-[#6B7280] uppercase tracking-wider font-semibold mb-2">Active Positions</p>
            {loading && !positions ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#00D4FF]" />
            ) : (
              <h2 className="text-[32px] font-bold text-text-main">{positionList.length}</h2>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Performance chart */}
            <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border-light">
                <h2 className="text-[18px] font-semibold text-text-main flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#00D4FF]" />
                  Wallet Performance (24h)
                </h2>
              </div>
              <div className="p-5">
                {loading && chartData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#00D4FF]" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center bg-foreground/5 rounded-xl border border-dashed border-border-light">
                    <p className="text-[#6B7280] text-[14px]">No chart data yet. Zerion may need a moment to sync your wallet.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tickFormatter={(v) => formatUsd(v)} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#111118", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                        itemStyle={{ color: "#00D4FF", fontWeight: 600 }}
                        formatter={(value: number) => [formatUsd(value), "Value"]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.time ?? ""}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#00D4FF"
                        fill="url(#portfolioGradient)"
                        strokeWidth={2}
                        activeDot={{ r: 6, fill: "#00D4FF", stroke: "#111118", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Token balances */}
            <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border-light flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-text-main flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#00D4FF]" />
                  Token Balances
                </h2>
                <Badge className="bg-foreground/10 text-text-main hover:bg-foreground/20 border-none px-3 py-1 text-[12px]">{walletPositions.length} Assets</Badge>
              </div>
              <div className="p-0">
                {loading && positionList.length === 0 ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00D4FF]" />
                  </div>
                ) : walletPositions.length === 0 ? (
                  <p className="text-[#6B7280] text-[14px] py-12 text-center">No token positions available.</p>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
                    {walletPositions.map((pos) => {
                      const info = pos.attributes?.fungible_info;
                      const value = pos.attributes?.value ?? 0;
                      const qty = pos.attributes?.quantity?.numeric ?? "0";
                      const symbol = info?.symbol ?? "Unknown";
                      const name = info?.name ?? "";
                      const icon = info?.icon?.url;
                      return (
                        <div
                          key={pos.id}
                          className="flex items-center justify-between py-3 px-5 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {icon ? (
                              <img src={icon} alt={symbol} className="h-9 w-9 rounded-full shrink-0 border border-border-light" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 border border-border-light">
                                <Coins className="h-4 w-4 text-[#6B7280]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-[15px] text-text-main truncate">{symbol}</p>
                              {name && <p className="text-[12px] text-[#6B7280] truncate">{name}</p>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-[15px] text-text-main">{formatUsd(value)}</p>
                            <p className="text-[12px] text-[#6B7280]">{Number(qty).toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* DeFi protocol positions */}
            <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border-light">
                <h2 className="text-[18px] font-semibold text-text-main flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#00D4FF]" />
                  DeFi Protocol Positions
                </h2>
              </div>
              <div className="p-5">
                {distribution && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    {[
                      { key: "wallet", label: "Wallet", value: distribution.wallet ?? 0 },
                      { key: "staked", label: "Staked", value: distribution.staked ?? 0 },
                      { key: "deposited", label: "Deposited", value: distribution.deposited ?? 0 },
                      { key: "locked", label: "Locked", value: distribution.locked ?? 0 },
                      { key: "borrowed", label: "Borrowed", value: distribution.borrowed ?? 0 },
                    ].map(({ key, label, value }) => (
                      <div key={key} className="rounded-xl border border-border-light bg-white/[0.02] p-3 text-center">
                        <p className="text-[11px] uppercase tracking-wider text-[#6B7280] font-semibold mb-1">{label}</p>
                        <p className="font-bold text-[14px] text-text-main">{formatUsd(value)}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {defiPositions.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[12px] uppercase tracking-wider text-[#6B7280] font-semibold mb-2">Active Protocols</p>
                    {defiPositions.map((pos) => {
                      const info = pos.attributes?.fungible_info;
                      const value = pos.attributes?.value ?? 0;
                      const protocol = pos.attributes?.protocol ?? pos.attributes?.position_type ?? "—";
                      return (
                        <div
                          key={pos.id}
                          className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] border border-border-light hover:bg-white/[0.05] transition-colors"
                        >
                          <div>
                            <p className="font-bold text-[14px] text-text-main">{info?.symbol ?? pos.id}</p>
                            <p className="text-[12px] text-[#6B7280] uppercase mt-0.5">{protocol}</p>
                          </div>
                          <p className="font-bold text-[15px] text-[#00D4FF]">{formatUsd(value)}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-border-light">
                    <p className="text-[#6B7280] text-[14px]">No active DeFi protocol positions detected.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* AI Insight */}
            <div className="bg-card-bg border border-[#A855F7]/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.05)] relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#A855F7]/50 to-transparent"></div>
              <div className="p-5 border-b border-border-light bg-gradient-to-b from-[#A855F7]/5 to-transparent">
                <h2 className="text-[16px] font-semibold text-text-main flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#A855F7]" />
                  AI Intelligence
                </h2>
                <p className="text-[13px] text-[#6B7280] mt-1">Smart analysis of your token distribution</p>
              </div>
              <div className="p-5">
                <Button
                  className="w-full bg-[#A855F7]/10 hover:bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30 h-10 mb-4 font-semibold"
                  disabled={aiLoading}
                  onClick={() => {
                    const context = `Portfolio total value: ${formatUsd(totalValue)}. 24h change: ${percent1d >= 0 ? "+" : ""}${percent1d.toFixed(2)}%. Positions: ${positionList.length}. Top symbols: ${walletPositions.slice(0, 8).map((p) => p.attributes?.fungible_info?.symbol ?? "?").join(", ")}.`;
                    fetchInsight(
                      context,
                      "Based on this portfolio snapshot, give 2-3 short sentences of insight or advice (diversification, risk, or what to watch). Be concise."
                    );
                  }}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Analyze Portfolio
                </Button>
                
                {aiError && (
                  <div className="p-3 rounded-lg bg-[#FF3B3B]/10 border border-[#FF3B3B]/20">
                    <p className="text-[#FF3B3B] text-[12px]">{aiError}</p>
                  </div>
                )}
                
                {aiInsight && (
                  <div className="p-4 rounded-lg bg-foreground/5 border border-border-light relative">
                    <div className="absolute -left-px top-4 bottom-4 w-[2px] bg-[#A855F7]"></div>
                    <p className="text-[14px] text-text-main/90 leading-relaxed font-medium">{aiInsight}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border-light">
                <h2 className="text-[16px] font-semibold text-text-main flex items-center gap-2">
                  <History className="h-4 w-4 text-[#00D4FF]" />
                  Transaction History
                </h2>
              </div>
              <div className="p-0">
                {loading && txList.length === 0 ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00D4FF]" />
                  </div>
                ) : txList.length === 0 ? (
                  <p className="text-[#6B7280] text-[13px] py-8 text-center px-4">No recent transactions found.</p>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
                    {txList.map((tx) => {
                      const attrs = tx.attributes;
                      const op = attrs?.operation_type ?? "—";
                      const hash = attrs?.hash;
                      const minedAt = attrs?.mined_at;
                      const status = attrs?.status;
                      
                      const isSuccess = status === 'confirmed' || status === 'success';
                      
                      return (
                        <div
                          key={tx.id}
                          className="py-3 px-5 hover:bg-white/[0.02] transition-colors group flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[14px] text-text-main capitalize mb-1">{String(op).replace(/_/g, " ")}</p>
                            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                              <span>{minedAt ? formatDate(minedAt) : tx.id.slice(0, 10)}</span>
                              {status && (
                                <Badge variant="outline" className={`h-4 text-[9px] uppercase px-1.5 border-none font-bold ${isSuccess ? 'bg-[#00FF88]/10 text-[#00FF88]' : 'bg-foreground/10 text-text-main'}`}>
                                  {status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {hash && (
                            <a
                              href={`https://solscan.io/tx/${hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-[#6B7280] hover:bg-foreground/10 hover:text-text-main shrink-0 transition-all opacity-50 group-hover:opacity-100 mt-1"
                              title="View on Solscan"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

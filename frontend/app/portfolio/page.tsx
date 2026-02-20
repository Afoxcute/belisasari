"use client";

import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useZerionPortfolio } from "@/hooks/use-zerion-portfolio";
import { useLogin } from "@privy-io/react-auth";
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
} from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
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
  const { login } = useLogin();
  const { portfolio, chart, positions, transactions, loading, error, refetch } =
    useZerionPortfolio(walletAddress);

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
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Portfolio Tracking (Zerion)
            </CardTitle>
            <CardDescription>
              Connect your wallet to view performance charts, token balances, DeFi positions, and transaction history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="bg-iris-primary hover:bg-iris-primary/90"
              onClick={() => login({ loginMethods: ["wallet"], walletChainType: "solana-only" })}
            >
              <Image src="/solana.png" width={20} height={20} className="rounded-full mr-2" alt="Solana" />
              Connect wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7" />
            Portfolio (Zerion)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Wallet performance, token balances, DeFi positions, and transaction history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
            <p className="text-muted-foreground text-xs mt-1">
              Add ZERION_API_KEY to your server environment to enable Zerion. Get a key at{" "}
              <a
                href="https://dashboard.zerion.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                dashboard.zerion.io
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Portfolio value + 24h change */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total value</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !portfolio ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-2xl font-bold">{formatUsd(totalValue)}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h change</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !portfolio ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <span className={`text-xl font-semibold flex items-center gap-1 ${percent1d >= 0 ? "text-green-600" : "text-red-600"}`}>
                {percent1d >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {percent1d >= 0 ? "+" : ""}{percent1d.toFixed(2)}% ({formatUsd(abs1d)})
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !positions ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-2xl font-bold">{positionList.length}</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Wallet performance (24h)
          </CardTitle>
          <CardDescription>Portfolio value over time (USD)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && chartData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              No chart data yet. Zerion may need a moment to sync your wallet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatUsd(v)} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [formatUsd(value), "Value"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.time ?? ""}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="url(#portfolioGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Token balance tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token balances
          </CardTitle>
          <CardDescription>Fungible holdings (wallet positions)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && positionList.length === 0 ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : walletPositions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No token positions to show.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {walletPositions.slice(0, 30).map((pos) => {
                const info = pos.attributes?.fungible_info;
                const value = pos.attributes?.value ?? 0;
                const qty = pos.attributes?.quantity?.numeric ?? "0";
                const symbol = info?.symbol ?? "???";
                const name = info?.name ?? "";
                const icon = info?.icon?.url;
                return (
                  <div
                    key={pos.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {icon ? (
                        <img src={icon} alt="" className="h-8 w-8 rounded-full shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{symbol}</p>
                        {name && <p className="text-xs text-muted-foreground truncate">{name}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium">{formatUsd(value)}</p>
                      <p className="text-xs text-muted-foreground">{Number(qty).toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                    </div>
                  </div>
                );
              })}
              {walletPositions.length > 30 && (
                <p className="text-muted-foreground text-xs py-2">+ {walletPositions.length - 30} more</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DeFi position monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            DeFi position monitoring
          </CardTitle>
          <CardDescription>
            Staked, deposited, and protocol positions (Solana protocol positions may be limited in Zerion)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {distribution && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { key: "wallet", label: "Wallet", value: distribution.wallet ?? 0 },
                { key: "staked", label: "Staked", value: distribution.staked ?? 0 },
                { key: "deposited", label: "Deposited", value: distribution.deposited ?? 0 },
                { key: "locked", label: "Locked", value: distribution.locked ?? 0 },
                { key: "borrowed", label: "Borrowed", value: distribution.borrowed ?? 0 },
              ].map(({ key, label, value }) => (
                <div key={key} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold">{formatUsd(value)}</p>
                </div>
              ))}
            </div>
          )}
          {defiPositions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Protocol positions</p>
              {defiPositions.map((pos) => {
                const info = pos.attributes?.fungible_info;
                const value = pos.attributes?.value ?? 0;
                const protocol = pos.attributes?.protocol ?? pos.attributes?.position_type ?? "—";
                return (
                  <div
                    key={pos.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{info?.symbol ?? pos.id}</p>
                      <p className="text-xs text-muted-foreground">{protocol}</p>
                    </div>
                    <p className="font-medium">{formatUsd(value)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No DeFi protocol positions detected.</p>
          )}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction history
          </CardTitle>
          <CardDescription>Recent wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && txList.length === 0 ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : txList.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No transactions to show.</p>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {txList.map((tx) => {
                const attrs = tx.attributes;
                const op = attrs?.operation_type ?? "—";
                const hash = attrs?.hash;
                const minedAt = attrs?.mined_at;
                const status = attrs?.status;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium capitalize">{String(op).replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{minedAt ? formatDate(minedAt) : tx.id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {status && <Badge variant="secondary" className="text-xs">{status}</Badge>}
                      {hash && (
                        <a
                          href={`https://solscan.io/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          title="View on Solscan"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

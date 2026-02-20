"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  ZerionPortfolioResponse,
  ZerionChartResponse,
  ZerionPositionsResponse,
  ZerionTransactionsResponse,
} from "@/lib/zerion";

export function useZerionPortfolio(walletAddress: string | null) {
  const [portfolio, setPortfolio] = useState<ZerionPortfolioResponse | null>(null);
  const [chart, setChart] = useState<ZerionChartResponse | null>(null);
  const [positions, setPositions] = useState<ZerionPositionsResponse | null>(null);
  const [transactions, setTransactions] = useState<ZerionTransactionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!walletAddress?.trim()) {
      setPortfolio(null);
      setChart(null);
      setPositions(null);
      setTransactions(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const addr = walletAddress.trim();
    try {
      const [portfolioRes, chartRes, positionsRes, txRes] = await Promise.all([
        fetch(`/api/zerion/portfolio?address=${encodeURIComponent(addr)}&currency=usd`),
        fetch(`/api/zerion/chart?address=${encodeURIComponent(addr)}&period=day&currency=usd`),
        fetch(`/api/zerion/positions?address=${encodeURIComponent(addr)}&currency=usd&page[size]=50`),
        fetch(`/api/zerion/transactions?address=${encodeURIComponent(addr)}&page[size]=20`),
      ]);

      const portfolioData = portfolioRes.ok ? await portfolioRes.json() : null;
      const chartData = chartRes.ok ? await chartRes.json() : null;
      const positionsData = positionsRes.ok ? await positionsRes.json() : null;
      const txData = txRes.ok ? await txRes.json() : null;

      if (!portfolioRes.ok && portfolioData?.error) setError(portfolioData.error);
      else if (!chartRes.ok && chartData?.error) setError(chartData.error);
      else if (!positionsRes.ok && positionsData?.error) setError(positionsData.error);
      else if (!txRes.ok && txData?.error) setError(txData.error);

      setPortfolio(portfolioData);
      setChart(chartData);
      setPositions(positionsData);
      setTransactions(txData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio");
      setPortfolio(null);
      setChart(null);
      setPositions(null);
      setTransactions(null);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    portfolio,
    chart,
    positions,
    transactions,
    loading,
    error,
    refetch,
  };
}

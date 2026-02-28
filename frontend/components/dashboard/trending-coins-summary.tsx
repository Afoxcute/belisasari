'use client';


import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { realTimeService } from '@/lib/real-time-service';
import { tiktokViewsService, TikTokViewsData } from '@/lib/tiktok-views-service';

interface SummaryMetrics {
  totalCoins: number;
  totalViews24h: number;
  topPerformer: {
    symbol: string;
    correlation: number;
    volume: number;
  };
  volumeLeader: {
    symbol: string;
    volume: number;
    views: number;
  };
  socialLeader: {
    symbol: string;
    views: number;
    mentions: number;
  };
  marketCapLeader: {
    symbol: string;
    marketCap: number;
    supply: number;
  };
}

export default function TrendingCoinsSummary() {
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [lastViewsUpdate, setLastViewsUpdate] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
  } | null>(null);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
  }, []);

  const fetchTotalTikTokViews = useCallback(async () => {
    try {
      setIsLoadingViews(true);
      const response = await fetch('/api/dashboard/total-tiktok-views?timeRange=24h');
      if (response.ok) {
        const data = await response.json();
        setLastViewsUpdate(new Date().toLocaleTimeString());
        return data.totalViews;
      }
    } catch (error) {
      console.error('Error fetching total TikTok views:', error);
    } finally {
      setIsLoadingViews(false);
    }
    return 0;
  }, []);

  const fetchData = useCallback(async () => {
    // Fetch both trending coins and total TikTok views
    const [trendingResponse, totalViews] = await Promise.all([
      fetch('/api/dashboard/trending-coins?limit=50'),
      fetchTotalTikTokViews()
    ]);

    if (trendingResponse.ok) {
      const trendingData = await trendingResponse.json();
      calculateSummaryMetrics(trendingData.coins, totalViews);
    }
  }, [fetchTotalTikTokViews]);

  const refreshTikTokViews = useCallback(async () => {
    console.log('🔄 Manually refreshing TikTok views...');
    setIsLoadingViews(true);
    
    try {
      const totalViews = await fetchTotalTikTokViews();
      if (metrics) {
        setMetrics(prev => prev ? { ...prev, totalViews24h: totalViews } : null);
      }
      setLastViewsUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Error refreshing TikTok views:', error);
    } finally {
      setIsLoadingViews(false);
    }
  }, [fetchTotalTikTokViews, metrics]);

  useEffect(() => {
    // Only fetch data after we're on the client side
    if (!isClient) return;
    
    fetchData();
    
    // Subscribe to real-time TikTok views updates
    const unsubscribeTikTokViews = tiktokViewsService.subscribe((data: TikTokViewsData) => {
      console.log('🔄 Real-time TikTok views update received:', data);
      
      // Update the metrics immediately with new TikTok views data
      setMetrics(prev => {
        if (prev) {
          setLastViewsUpdate(new Date().toLocaleTimeString());
          return { ...prev, totalViews24h: data.totalViews };
        }
        return null;
      });
      
      // Also update loading state
      setIsLoadingViews(false);
    });
    
    // Subscribe to real-time trending updates only if service is available
    if (realTimeService) {
      const unsubscribeTrending = realTimeService.subscribe('trending_update', (newData) => {
        // Update metrics when new trending coin data arrives
        fetchData();
      });

      // Cleanup subscription
      return () => {
        unsubscribeTrending();
        unsubscribeTikTokViews();
      };
    }

    // Cleanup TikTok views subscription
    return () => {
      unsubscribeTikTokViews();
    };
  }, [isClient, fetchData]);

  // Monitor connection status
  useEffect(() => {
    if (!isClient) return;

    const updateConnectionStatus = () => {
      setConnectionStatus(tiktokViewsService.getConnectionStatus());
    };

    // Update status immediately
    updateConnectionStatus();

    // Update status every second
    const statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => clearInterval(statusInterval);
  }, [isClient]);

  // Initialize connection status
  useEffect(() => {
    if (isClient && connectionStatus === null) {
      setConnectionStatus({ isConnected: false, isConnecting: false, reconnectAttempts: 0 });
    }
  }, [isClient, connectionStatus]);

  // Error boundary for real-time service failures
  useEffect(() => {
    if (isClient && connectionStatus && connectionStatus.reconnectAttempts >= 5) {
      console.warn('⚠️ Real-time service failed to connect after multiple attempts');
      // Fallback to polling mode
      const fallbackInterval = setInterval(() => {
        fetchTotalTikTokViews().then(totalViews => {
          if (metrics) {
            setMetrics(prev => prev ? { ...prev, totalViews24h: totalViews } : null);
          }
        });
      }, 30000); // Poll every 30 seconds as fallback

      return () => clearInterval(fallbackInterval);
    }
  }, [isClient, connectionStatus, metrics, fetchTotalTikTokViews]);

  const calculateSummaryMetrics = (coins: any[], totalViews: number) => {
    if (!coins.length) {
      // Set empty metrics when no data is available
      setMetrics({
        totalCoins: 0,
        totalViews24h: 0,
        topPerformer: { symbol: 'N/A', correlation: 0, volume: 0 },
        volumeLeader: { symbol: 'N/A', volume: 0, views: 0 },
        socialLeader: { symbol: 'N/A', views: 0, mentions: 0 },
        marketCapLeader: { symbol: 'N/A', marketCap: 0, supply: 0 }
      });
      return;
    }

    // Find top performer by correlation
    const topPerformer = coins.reduce((best, coin) => 
      coin.correlation_score > best.correlation_score ? coin : best
    );

    // Find volume leader
    const volumeLeader = coins.reduce((best, coin) => 
      coin.trading_volume_24h > best.trading_volume_24h ? coin : best
    );

    // Find social leader
    const socialLeader = coins.reduce((best, coin) => 
      coin.tiktok_views_24h > best.tiktok_views_24h ? coin : best
    );

    setMetrics({
      totalCoins: coins.length,
      totalViews24h: totalViews,
      topPerformer: {
        symbol: topPerformer.symbol,
        correlation: topPerformer.correlation_score,
        volume: topPerformer.trading_volume_24h
      },
      volumeLeader: {
        symbol: volumeLeader.symbol,
        volume: volumeLeader.trading_volume_24h,
        views: volumeLeader.tiktok_views_24h
      },
      socialLeader: {
        symbol: socialLeader.symbol,
        views: socialLeader.tiktok_views_24h,
        mentions: socialLeader.total_mentions
      },
      marketCapLeader: coins.reduce((best, coin) => 
        (coin.market_cap || 0) > (best.market_cap || 0) ? coin : best
      , { symbol: 'N/A', marketCap: 0, supply: 0 })
    });
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00';
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatViews = (views: number | undefined | null): string => {
    if (views === undefined || views === null || isNaN(views)) {
      return '0';
    }
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatCorrelation = (score: number | undefined | null): string => {
    if (score === undefined || score === null || isNaN(score)) {
      return '0.0%';
    }
    return `${(score * 100).toFixed(1)}%`;
  };



  const getCorrelationColor = (score: number | undefined | null): string => {
    if (score === undefined || score === null || isNaN(score)) {
      return 'text-text-secondary';
    }
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!isClient) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-text-secondary">Initializing...</p>
            </CardContent>
          </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-text-secondary">Loading summary metrics...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safety check to ensure all required metrics are available
  if (!metrics.totalCoins || !metrics.topPerformer || !metrics.volumeLeader || !metrics.socialLeader || !metrics.marketCapLeader) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-text-secondary">Preparing dashboard data...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-xs text-text-secondary">
              Loading trending coins and market data...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show "no data" state when all metrics are zero or N/A
  const hasNoData = metrics.totalCoins === 0 && 
                   metrics.totalViews24h === 0 && 
                   metrics.topPerformer.symbol === 'N/A' && 
                   metrics.volumeLeader.symbol === 'N/A' && 
                   metrics.socialLeader.symbol === 'N/A';

  if (hasNoData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-main mb-2">No Trending Data Available</h3>
              <p className="text-text-secondary text-sm mb-4">
                No trending coins data is currently available. This could be because:
              </p>
              <ul className="text-xs text-text-secondary space-y-1 text-left max-w-md mx-auto">
                <li>• The database is not populated with token data</li>
                <li>• Price data collection is not running</li>
                <li>• TikTok scraper is not collecting data</li>
                <li>• No recent activity in the last 24 hours</li>
              </ul>
            </div>
            <div className="pt-4">
              <p className="text-xs text-text-secondary">
                Check your scrapers and data collection services to start seeing trending coins data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Additional safety check for real-time service initialization
  if (!connectionStatus) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-text-secondary">Initializing real-time service...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Coins Analyzed */}
      <div className="bg-card-bg border border-border-light rounded-xl p-5 flex items-center justify-between col-span-1 md:col-span-1">
        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
            Coins Analyzed
            {connectionStatus && !connectionStatus.isConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1" title="Offline"></span>
            )}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-text-main">
              {metrics?.totalCoins || 0}
            </p>
            <span className="text-xs font-normal text-[#00D4FF]">+12%</span>
          </div>
          {lastViewsUpdate && <p className="text-[10px] text-text-secondary mt-1">Updated: {lastViewsUpdate}</p>}
        </div>
        <div className="relative w-14 h-14">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path className="stroke-white/10 fill-none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeWidth="3"></path>
            <path className="stroke-[#00D4FF] fill-none" strokeDasharray="75 25" strokeDashoffset="25" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeLinecap="round" strokeWidth="3"></path>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-main">75%</div>
        </div>
      </div>

      {/* Grouped Stats Component */}
      <div className="bg-card-bg border border-border-light rounded-xl p-5 flex-1 col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Market Cap Leader / Global Volume Mock */}
        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Top Market Cap</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl font-bold text-text-main">
              {metrics?.marketCapLeader?.symbol !== 'N/A' 
                ? formatCurrency(metrics?.marketCapLeader?.marketCap)
                : '$4.2B'}
            </p>
            <span className="text-xs font-normal text-emerald-400">↑ 4.2%</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {metrics?.marketCapLeader?.symbol !== 'N/A' 
              ? `Leader: ${metrics?.marketCapLeader?.symbol}` 
              : 'Global Volume'}
          </p>
        </div>

        {/* Top Performer / Bullish Signals */}
        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Top Performing Coin</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl font-bold text-text-main">
              {metrics?.topPerformer?.symbol !== 'N/A' ? metrics?.topPerformer?.symbol : '32'}
            </p>
            <span className="text-xs font-normal text-text-secondary">
              {metrics?.topPerformer?.symbol !== 'N/A' ? '/ Strong Buy' : '/ 50'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {metrics?.topPerformer?.correlation ? `Correlation: ${formatCorrelation(metrics.topPerformer.correlation)}` : 'Bullish Signals'}
          </p>
        </div>

        {/* Social Views Leader / Market Sentiment */}
        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Social Views / Sentiment</p>
          <p className="text-xl font-bold mt-1 text-[#00D4FF]">
            {metrics?.totalViews24h && metrics.totalViews24h > 0 
              ? `${formatViews(metrics.totalViews24h)} Views` 
              : 'Fear/Greed: 68'}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {metrics?.socialLeader?.symbol !== 'N/A' 
              ? `Most viral: ${metrics?.socialLeader?.symbol}` 
              : 'Market Sentiment'}
          </p>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RealTimeData from '@/components/dashboard/real-time-data';
import TrendingCoinsSummary from '@/components/dashboard/trending-coins-summary';
import TrendingCoinsAnalytics from '@/components/dashboard/trending-coins-analytics';
import { PatternRecognitionCard } from '@/components/dashboard/pattern-recognition-card';
import { BackendServicesCard } from '@/components/dashboard/backend-services-card';
import ErrorBoundary from '@/components/dashboard/error-boundary';

export default function DashboardClient() {
  const [scraperStatus, setScraperStatus] = useState({
    tiktok: {
      status: 'active',
      lastRun: null as Date | null,
      totalVideos: 1247,
      videosToday: 45
    },
    telegram: {
      status: 'active',
      lastRun: null as Date | null,
      totalMessages: 15420,
      messagesToday: 234
    },
    patternAnalysis: {
      status: 'active',
      lastRun: null as Date | null,
      totalAnalyses: 89,
      analysesToday: 12
    },
    twitter: {
      status: 'active',
      lastRun: null as Date | null,
      totalAlerts: 156,
      alertsToday: 8
    }
  });

  // Set the dates on the client side to avoid hydration mismatch
  useEffect(() => {
    const now = Date.now();
    setScraperStatus(prev => ({
      ...prev,
      tiktok: { ...prev.tiktok, lastRun: new Date(now - 1000 * 60 * 30) },
      telegram: { ...prev.telegram, lastRun: new Date(now - 1000 * 60 * 15) },
      patternAnalysis: { ...prev.patternAnalysis, lastRun: new Date(now - 1000 * 60 * 60) },
      twitter: { ...prev.twitter, lastRun: new Date(now - 1000 * 60 * 45) }
    }));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Loading...';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };



  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bimboh Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time memecoin analytics from Jupiter tokens & prices, TikTok and Telegram trends
        </p>
      </div>

      {/* Real-time Data Overview */}
      <ErrorBoundary>
        <RealTimeData />
      </ErrorBoundary>

      {/* AI-Powered Features */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">🤖 AI-Powered Features</h2>
          <p className="text-muted-foreground">
            Advanced pattern recognition, decision making, and backend service management
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <PatternRecognitionCard />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <BackendServicesCard />
          </ErrorBoundary>
        </div>
      </div>

      {/* Trending Coins Analytics */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">🚀 Trending Coins Analytics</h2>
          <p className="text-muted-foreground">
            Monitor top trending coins with 24-hour trading volume, TikTok view counts, and volume/social correlation metrics
          </p>
        </div>
        
        {/* Summary Metrics */}
        <ErrorBoundary>
          <TrendingCoinsSummary />
        </ErrorBoundary>
        
        {/* Detailed Analytics */}
        <ErrorBoundary>
          <TrendingCoinsAnalytics />
        </ErrorBoundary>
      </div>

      {/* System Status Overview */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* TikTok Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📱 TikTok Integration
                <div className={`w-3 h-3 rounded-full ${getStatusColor(scraperStatus.tiktok.status)}`}></div>
              </CardTitle>
              <CardDescription>
                TikTok data collection and analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Videos</p>
                  <p className="text-2xl font-bold">{scraperStatus.tiktok.totalVideos.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{scraperStatus.tiktok.videosToday.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Last Run: {formatTimeAgo(scraperStatus.tiktok.lastRun)}
              </p>
            </CardContent>
          </Card>

          {/* Telegram Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💬 Telegram Integration
                <div className={`w-3 h-3 rounded-full ${getStatusColor(scraperStatus.telegram.status)}`}></div>
              </CardTitle>
              <CardDescription>
                Telegram channel monitoring and message analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{scraperStatus.telegram.totalMessages.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{scraperStatus.telegram.messagesToday.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Last Run: {formatTimeAgo(scraperStatus.telegram.lastRun)}
              </p>
            </CardContent>
          </Card>

          {/* Pattern Analysis Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧠 Pattern Analysis
                <div className={`w-3 h-3 rounded-full ${getStatusColor(scraperStatus.patternAnalysis.status)}`}></div>
              </CardTitle>
              <CardDescription>
                AI-powered trend analysis and correlation detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Analyses</p>
                  <p className="text-2xl font-bold">{scraperStatus.patternAnalysis.totalAnalyses.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{scraperStatus.patternAnalysis.analysesToday.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Last Run: {formatTimeAgo(scraperStatus.patternAnalysis.lastRun)}
              </p>
            </CardContent>
          </Card>

          {/* Twitter Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🐦 Twitter Integration
                <div className={`w-3 h-3 rounded-full ${getStatusColor(scraperStatus.twitter.status)}`}></div>
              </CardTitle>
              <CardDescription>
                Market alerts and automated posting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold">{scraperStatus.twitter.totalAlerts.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{scraperStatus.twitter.alertsToday.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Last Run: {formatTimeAgo(scraperStatus.twitter.lastRun)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}

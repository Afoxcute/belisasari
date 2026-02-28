"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users, Activity, Target, Zap } from "lucide-react";

interface AnalyticsData {
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalMentions: number;
  topTokens: Array<{
    symbol: string;
    mentionCount: number;
    change: number;
  }>;
  recentActivity: Array<{
    time: string;
    action: string;
    details: string;
  }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [searchTerm, setSearchTerm] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only fetch data after we're on the client side
    if (!isClient) return;
    
    fetchAnalytics();
    
    // Auto-refresh every minute
    const interval = setInterval(fetchAnalytics, 60000);
    
    return () => clearInterval(interval);
  }, [isClient]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch TikTok data
      const tiktokResponse = await fetch('/api/supabase/get-tiktoks?limit=1000');
      const tiktokData = await tiktokResponse.json();
      
      // Fetch mentions data
      const mentionsResponse = await fetch('/api/supabase/get-mentions?limit=1000');
      const mentionsData = await mentionsResponse.json();
      
      // Process analytics
      const videos = tiktokData.data || [];
      const mentions = mentionsData.data || [];
      
      // Calculate totals
      const totalViews = videos.reduce((sum: number, v: any) => sum + (v.views || 0), 0);
      const totalComments = videos.reduce((sum: number, v: any) => sum + (v.comments || 0), 0);
      
      // Process token mentions
      const tokenCounts = new Map<string, number>();
      mentions.forEach((mention: any) => {
        const symbol = mention.token?.symbol || `Token ${mention.token_id}`;
        tokenCounts.set(symbol, (tokenCounts.get(symbol) || 0) + mention.count);
      });
      
      const topTokens = Array.from(tokenCounts.entries())
        .map(([symbol, count]) => ({ 
          symbol, 
          mentionCount: count, 
          change: Math.abs(symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 20 - 10 
        }))
        .sort((a, b) => b.mentionCount - a.mentionCount)
        .slice(0, 5);
      
      // Generate recent activity
      const recentActivity = videos.slice(0, 5).map((video: any) => ({
        time: video.fetched_at, // Store the raw timestamp
        action: "New TikTok",
        details: `@${video.username} posted with ${video.views} views`
      }));
      
      setAnalytics({
        totalVideos: videos.length,
        totalViews,
        totalComments,
        totalMentions: mentions.length,
        topTokens,
        recentActivity
      });
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  if (loading || !isClient) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-iris-primary"></div>
        <span className="ml-2 text-text-secondary">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto mt-16 mb-24 flex flex-col gap-12">
      {/* 4-Stat Row */}
      <div className="w-full bg-card-bg border border-border-light rounded-xl overflow-hidden">
        <div className="w-full h-[1px] bg-gradient-to-r from-[#00D4FF]/40 to-transparent"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="px-8 py-6 flex flex-col justify-center">
            <span className="text-[13px] text-[#6B7280] font-medium mb-1 uppercase tracking-[0.08em]">Total Videos</span>
            <span className="text-[28px] font-bold text-text-main">{analytics.totalVideos.toLocaleString()}</span>
          </div>
          <div className="px-8 py-6 flex flex-col justify-center">
            <span className="text-[13px] text-[#6B7280] font-medium mb-1 uppercase tracking-[0.08em]">Total Views</span>
            <span className="text-[28px] font-bold text-text-main">{formatNumber(analytics.totalViews)}</span>
          </div>
          <div className="px-8 py-6 flex flex-col justify-center">
            <span className="text-[13px] text-[#6B7280] font-medium mb-1 uppercase tracking-[0.08em]">Mentions</span>
            <span className="text-[28px] font-bold text-[#00D4FF]">{analytics.totalMentions.toLocaleString()}</span>
          </div>
          <div className="px-8 py-6 flex flex-col justify-center">
            <span className="text-[13px] text-[#6B7280] font-medium mb-1 uppercase tracking-[0.08em]">Comments</span>
            <span className="text-[28px] font-bold text-text-main">{formatNumber(analytics.totalComments)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Search & Filter Bar Section */}
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-text-main flex items-center gap-3">
              <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
              Intelligence Search
            </h3>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[120px] h-9 bg-card-bg border-border-light text-text-main rounded-[6px] text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card-bg border-border-light text-text-main">
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={fetchAnalytics}
                variant="outline"
                className="h-9 border-border-light text-text-main hover:bg-foreground/5 rounded-[6px] text-[13px] px-4"
              >
                <Activity className="h-4 w-4 mr-2 text-[#00D4FF]" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#6B7280]"><path fillRule="evenodd" clipRule="evenodd" d="M15 10.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM17.437 18.5a8 8 0 111.06-1.06l4.288 4.288a.75.75 0 11-1.06 1.06l-4.288-4.288z" fill="currentColor"/></svg>
            </div>
            <Input
              placeholder="Search memecoins, tokens, patterns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[48px] pl-14 pr-[60px] bg-card-bg border border-border-light rounded-full text-[15px] text-text-main placeholder:text-[#6B7280] focus-visible:ring-1 focus-visible:ring-[#00D4FF]/50"
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <span className="text-[12px] text-[#6B7280] font-medium border border-border-light px-2 py-1 rounded bg-black/40">⌘K</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors bg-[#00D4FF] text-black border border-[#00D4FF]">
              All Platforms
            </button>
            <button className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors bg-card-bg text-[#6B7280] border border-border-light hover:text-text-main hover:border-white/30">
              TikTok
            </button>
            <button className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors bg-card-bg text-[#6B7280] border border-border-light hover:text-text-main hover:border-white/30">
              Telegram
            </button>
            <button className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors bg-card-bg text-[#6B7280] border border-border-light hover:text-text-main hover:border-white/30">
              X (Twitter)
            </button>
          </div>
        </div>

        {/* Recent Activity Vertical Timeline */}
        <div className="w-full bg-card-bg border border-border-light rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#00D4FF]/40 to-transparent"></div>
          <h3 className="text-[15px] font-semibold text-text-main mb-6">Recent Activity Feed</h3>
          
          <div className="relative pl-3 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-foreground/10"></div>
            
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="relative pl-6">
                <div className={`absolute left-[-1.5px] top-1.5 w-[11px] h-[11px] rounded-full border-[2px] border-[#111118] ${index === 0 ? 'bg-[#00D4FF] shadow-[0_0_8px_#00D4FF]' : 'bg-[#6B7280]'}`}></div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-text-main">{activity.action}</span>
                    <span className="text-[11px] text-[#6B7280]">{formatTime(activity.time)}</span>
                  </div>
                  <p className="text-[13px] text-[#6B7280] leading-snug">{activity.details}</p>
                </div>
              </div>
            ))}
            
            {analytics.recentActivity.length === 0 && (
              <p className="text-sm text-[#6B7280] italic ml-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

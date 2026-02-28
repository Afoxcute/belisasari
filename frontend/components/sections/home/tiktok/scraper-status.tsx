"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Activity, Clock, Zap } from "lucide-react";

interface ScraperStatus {
  isRunning: boolean;
  lastRun: string | null;
  totalVideos: number;
  videosToday: number;
  nextRun: string | null;
}

export default function ScraperStatus() {
  const [status, setStatus] = useState<ScraperStatus>({
    isRunning: false,
    lastRun: null,
    totalVideos: 0,
    videosToday: 0,
    nextRun: null
  });
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch TikTok data to determine status
      const response = await fetch('/api/supabase/get-tiktoks?limit=1000');
      const data = await response.json();
      
      const videos = data.data || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate videos from today
      const videosToday = videos.filter((video: any) => {
        const videoDate = new Date(video.fetched_at);
        return videoDate >= today;
      }).length;
      
      // Estimate if scraper is running based on recent activity
      const recentVideos = videos.filter((video: any) => {
        const videoDate = new Date(video.fetched_at);
        const diffMinutes = (now.getTime() - videoDate.getTime()) / (1000 * 60);
        return diffMinutes < 10; // Consider scraper running if videos in last 10 minutes
      });
      
      const isRunning = recentVideos.length > 0;
      const lastRun = videos.length > 0 ? videos[0].fetched_at : null;
      
      setStatus({
        isRunning,
        lastRun,
        totalVideos: videos.length,
        videosToday,
        nextRun: isRunning ? null : new Date(now.getTime() + 5 * 60 * 1000).toISOString() // 5 minutes from now
      });
      
    } catch (error) {
      console.error('Error fetching scraper status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data after we're on the client side
    if (!isClient) return;
    
    fetchStatus();
    
    // Update status every minute
    const interval = setInterval(fetchStatus, 60000);
    
    return () => clearInterval(interval);
  }, [isClient]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Starting now';
    if (diffInMinutes < 60) return `in ${diffInMinutes}m`;
    return `in ${Math.floor(diffInMinutes / 60)}h`;
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto mb-8 sm:mb-12 lg:mb-16">
        <div className="flex items-center gap-4 bg-card-bg border border-border-light rounded-lg px-4 py-3 w-max">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00D4FF]"></div>
          <span className="text-sm text-text-secondary">Checking system status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto mb-8 sm:mb-12 lg:mb-16 overflow-x-auto">
      <div className="flex items-center gap-4 bg-card-bg border border-border-light rounded-lg px-4 py-3 w-max whitespace-nowrap">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 pr-4 border-r border-border-light">
          <div className={`w-2 h-2 rounded-full ${status.isRunning ? 'bg-[#00FF88] shadow-[0_0_6px_#00FF88] animate-pulse' : 'bg-gray-500'}`} />
          <span className={`text-sm font-medium ${status.isRunning ? 'text-[#00FF88]' : 'text-text-secondary'}`}>
            System Status: {status.isRunning ? 'Live' : 'Idle'}
          </span>
        </div>

        {/* Last Sync */}
        <div className="flex items-center gap-2 pr-4 border-r border-border-light">
          <span className="text-sm text-[#6B7280]">Last Sync:</span>
          <span className="text-sm text-text-main">{status.lastRun ? formatTimeAgo(status.lastRun) : 'Never'}</span>
        </div>

        {/* Total Data Points */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6B7280]">Total Data Points:</span>
          <span className="text-sm text-text-main font-medium">
            {status.totalVideos >= 1000000 
              ? `${(status.totalVideos / 1000000).toFixed(1)}M` 
              : status.totalVideos >= 1000 
                ? `${(status.totalVideos / 1000).toFixed(1)}K` 
                : status.totalVideos}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye, MessageCircle, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface TikTokData {
  id: string;
  username: string;
  url: string;
  thumbnail: string;
  created_at: string;
  fetched_at: string;
  views: number;
  comments: number;
}

interface TokenMention {
  id: number;
  tiktok_id: string;
  token_id: number;
  count: number;
  mention_at: string;
  token?: {
    symbol: string;
    name: string;
  };
}

export default function RealTimeTikTokFeed() {
  const [tiktoks, setTiktoks] = useState<TikTokData[]>([]);
  const [mentions, setMentions] = useState<TokenMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleVideos, setVisibleVideos] = useState(12);

  const fetchTikTokData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      console.log('🔄 Fetching TikTok data...');
      
      // Fetch TikTok data
      const tiktokResponse = await fetch('/api/supabase/get-tiktoks?limit=100');
      if (!tiktokResponse.ok) {
        throw new Error(`TikTok API error: ${tiktokResponse.status}`);
      }
        const tiktokData = await tiktokResponse.json();
      
      // Fetch mentions data
      const mentionsResponse = await fetch('/api/supabase/get-mentions?limit=1000');
      if (!mentionsResponse.ok) {
        throw new Error(`Mentions API error: ${mentionsResponse.status}`);
      }
      const mentionsData = await mentionsResponse.json();
      
      console.log('📊 TikTok data received:', tiktokData);
      console.log('🔗 Mentions data received:', mentionsData);
      
      if (tiktokData.data && Array.isArray(tiktokData.data)) {
        const sorted = [...tiktokData.data].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setTiktoks(sorted);
        console.log(`✅ Set ${sorted.length} TikTok videos (newest first)`);
      } else {
        console.warn('⚠️ TikTok data is not an array:', tiktokData);
        setTiktoks([]);
      }
      
      if (mentionsData.data && Array.isArray(mentionsData.data)) {
        setMentions(mentionsData.data);
        console.log(`✅ Set ${mentionsData.data.length} mentions`);
      } else {
        console.warn('⚠️ Mentions data is not an array:', mentionsData);
        setMentions([]);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching TikTok data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only fetch data after we're on the client side
    if (!isClient) return;

    fetchTikTokData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchTikTokData, 30000);
    
    return () => clearInterval(interval);
  }, [isClient]);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getTokenMentions = (tiktokId: string) => {
    return mentions.filter(mention => mention.tiktok_id === tiktokId);
  };

  // Filter out TikTok videos with 0 views and 0 comments
  const filteredTiktoks = tiktoks.filter(tiktok => 
    (tiktok.views > 0 || tiktok.comments > 0)
  );

  const handleLoadMore = () => {
    setVisibleVideos(prev => prev + 12);
  };

  // Reset visible videos when filtered data changes
  useEffect(() => {
    setVisibleVideos(12);
  }, [filteredTiktoks.length]);

  // Don't render until client-side
  if (!isClient) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-iris-primary/20 border-t-iris-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading TikTok feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
          <h2 className="text-[18px] font-semibold text-text-main">Live TikTok Feed</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <p className="text-[13px] text-[#6B7280]">
              Last updated: {formatTimeAgo(lastUpdate.toISOString())}
            </p>
          )}
          
          <Button
            onClick={fetchTikTokData}
            disabled={refreshing}
            variant="outline"
            className="bg-white border border-border-light-light text-text-secondary hover:bg-slate-50 hover:text-text-main hover:border-slate-300 transition-all shadow-sm h-9 rounded-[6px] text-[13px] px-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 text-primary ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error loading data:</span>
            <span>{error}</span>
          </div>
          <Button
            onClick={fetchTikTokData}
            variant="outline"
            size="sm"
            className="mt-2 bg-white border border-red-500 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all shadow-sm"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-iris-primary/20 border-t-iris-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading TikTok data...</p>
      </div>
      )}

      {/* TikTok Videos Grid */}
      {!loading && filteredTiktoks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredTiktoks.slice(0, visibleVideos).map((tiktok) => {
            const tiktokMentions = getTokenMentions(tiktok.id);
            
            return (
              <div
                key={tiktok.id}
                className="bg-card-bg rounded-[10px] border border-border-light overflow-hidden transition-all duration-300 hover:border-[#00D4FF]/50 hover:shadow-[0_4px_20px_rgba(0,212,255,0.1)] flex flex-col"
              >
                {/* Thumbnail Area */}
                <a href={tiktok.url} target="_blank" rel="noopener noreferrer" className="relative w-full aspect-[9/16] max-h-[280px] bg-[#1A1A24] overflow-hidden group block">
                  {tiktok.thumbnail ? (
                    <img
                      src={tiktok.thumbnail}
                      alt={`TikTok by ${tiktok.username}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 rounded-sm bg-foreground/10 animate-pulse"></div>
                    </div>
                  )}

                  {/* Top-right Time Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[11px] font-medium text-text-main flex items-center gap-1">
                    {formatTimeAgo(tiktok.created_at)}
                  </div>
                  
                  {/* Bottom Gradient overlay */}
                  <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                    {/* Token Mentions Pills */}
                    {tiktokMentions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        {tiktokMentions.map((mention) => (
                          <div
                            key={mention.id}
                            className="bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            #{mention.token?.symbol || `${mention.token_id}`}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-text-main">
                          <Eye className="w-4 h-4" />
                          <span className="text-[13px] font-bold">{formatViews(tiktok.views)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-text-main">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-[13px] font-bold">{tiktok.comments}</span>
                        </div>
                      </div>
                      <div className="bg-[#FF0050] w-6 h-6 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="white" className="w-[14px] h-[14px]"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                      </div>
                    </div>
                  </div>
                </a>

                {/* Creator bottom row */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-purple-600 flex items-center justify-center text-text-main font-bold text-sm shadow-inner shrink-0 object-cover overflow-hidden">
                    {tiktok.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold text-text-main truncate">@{tiktok.username}</span>
                    <span className="text-[12px] text-[#6B7280] truncate">TikTok Creator</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {!loading && filteredTiktoks.length > visibleVideos && (
        <div className="text-center mt-8">
          <Button 
            onClick={handleLoadMore}
            variant="outline" 
            className="bg-white border border-primary text-primary hover:bg-slate-50 hover:text-primary-hover transition-all shadow-sm"
          >
            Load More Videos ({filteredTiktoks.length - visibleVideos} remaining)
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTiktoks.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-text-main" />
          </div>
          <h3 className="text-lg font-semibold text-text-main mb-2 meme-comic">No Active TikTok Videos Found</h3>
          <p className="text-text-secondary mb-4 meme-body">
            Only videos with views or comments are shown. Start scraping to collect engagement data!
          </p>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>• Check if your scraper is running</p>
            <p>• Verify database connection</p>
            <p>• Run the setup scripts if needed</p>
          </div>
          <Button
            onClick={fetchTikTokData}
            className="mt-4 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover shadow-sm shadow-primary/30 transition-all"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-muted/20 rounded-lg text-xs text-text-secondary">
          <p><strong>Debug Info:</strong></p>
          <p>TikTok count: {tiktoks.length}</p>
          <p>Mentions count: {mentions.length}</p>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'None'}</p>
        </div>
      )} */}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Users, 
  Clock, 
  Activity, 
  Search, 
  ExternalLink,
  Play,
  Pause,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { telegramChannelsService, TelegramChannelsData, TelegramChannel } from '@/lib/telegram-channels-service';

export default function TelegramChannelsHome() {
  const [data, setData] = useState<TelegramChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [visibleChannels, setVisibleChannels] = useState(6);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0
  });

  const fetchTelegramData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      console.log('🔄 Fetching Telegram channels data...');
      
      const channelsData = await telegramChannelsService.fetchChannels();
      if (channelsData) {
        setData(channelsData);
        setLastUpdate(new Date());
        console.log(`✅ Set ${channelsData.channels.length} Telegram channels`);
      } else {
        throw new Error('Failed to fetch channels data');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching Telegram channels data:', error);
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

    let unsubscribe: (() => void) | null = null;

    const initializeService = async () => {
      try {
        setLoading(true);
        setError(null);

        // Subscribe to real-time updates
        unsubscribe = telegramChannelsService.subscribe((newData) => {
          setData(newData);
          setLoading(false);
          setLastUpdate(new Date());
        });

        // Update connection status
        const updateConnectionStatus = () => {
          setConnectionStatus(telegramChannelsService.getConnectionStatus());
        };

        updateConnectionStatus();
        const statusInterval = setInterval(updateConnectionStatus, 1000);

        // Initial fetch
        await fetchTelegramData();

        return () => {
          clearInterval(statusInterval);
        };
      } catch (err) {
        console.error('Error initializing Telegram channels service:', err);
        setError('Failed to load Telegram channels');
        setLoading(false);
      }
    };

    const cleanup = initializeService();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [isClient]);

  const handleToggleChannel = async (channel: TelegramChannel) => {
    try {
      const updatedChannel = await telegramChannelsService.updateChannel(channel.id, {
        enabled: !channel.enabled
      });
      
      if (updatedChannel) {
        // Update local state optimistically
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            channels: prev.channels.map(c => 
              c.id === channel.id ? { ...c, enabled: updatedChannel.enabled } : c
            ),
            summary: {
              ...prev.summary,
              enabledChannels: prev.summary.enabledChannels + (updatedChannel.enabled ? 1 : -1),
              disabledChannels: prev.summary.disabledChannels + (updatedChannel.enabled ? -1 : 1)
            }
          };
        });
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const filteredChannels = (data?.channels.filter(channel => {
    const matchesSearch = channel.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && channel.enabled) ||
                         (statusFilter === 'disabled' && !channel.enabled);
    
    const hasMessages = channel.stats.totalMessages > 0;
    
    return matchesSearch && matchesStatus && hasMessages;
  }) || [])
    .sort((a, b) => {
      const aTime = a.stats?.lastMessageAt ? new Date(a.stats.lastMessageAt).getTime() : 0;
      const bTime = b.stats?.lastMessageAt ? new Date(b.stats.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });

  // Debug logging
  console.log('Telegram Channels Debug:', {
    totalChannels: data?.channels.length || 0,
    filteredChannels: filteredChannels.length,
    visibleChannels,
    showLoadMore: filteredChannels.length > visibleChannels
  });

  // Reset visible channels when filters change
  useEffect(() => {
    setVisibleChannels(6);
  }, [searchTerm, statusFilter]);

  const formatLastMessage = (lastMessageAt: string | null) => {
    if (!lastMessageAt) return 'No messages';
    
    const date = new Date(lastMessageAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessages = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getConnectionStatusColor = () => {
    if (connectionStatus.isConnected) return 'text-green-500';
    if (connectionStatus.isConnecting) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConnectionStatusText = () => {
    if (connectionStatus.isConnected) return '● Live';
    if (connectionStatus.isConnecting) return '● Connecting';
    return '● Disconnected';
  };

  const handleLoadMore = () => {
    setVisibleChannels(prev => prev + 12);
  };

  // Don't render until client-side
  if (!isClient) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-iris-primary/20 border-t-iris-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading Telegram channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 sm:py-6 lg:py-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
          <div>
            <h2 className="text-[18px] font-semibold text-text-main flex items-center gap-3">
              Telegram Channels
              <span className={`text-[12px] px-2 py-0.5 rounded border font-medium flex items-center gap-1.5 ${
                connectionStatus.isConnected ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20' : 
                connectionStatus.isConnecting ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {connectionStatus.isConnected ? <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse"></span> : null}
                {connectionStatus.isConnected ? 'Live' : connectionStatus.isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </h2>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
          {lastUpdate && (
            <p className="text-[13px] text-[#6B7280]">
              Last updated: {formatLastMessage(lastUpdate.toISOString())}
            </p>
          )}
          
          <Button
            onClick={fetchTelegramData}
            disabled={refreshing}
            variant="outline"
            className="border-border-light text-text-main hover:bg-foreground/5 h-9 rounded-[6px] text-[13px] px-4 w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 text-[#00D4FF] ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-card-bg border border-border-light rounded-xl p-4 flex flex-col justify-center">
            <span className="text-[13px] text-[#6B7280] font-medium mb-1 uppercase tracking-[0.08em]">Total Channels</span>
            <span className="text-[24px] lg:text-[28px] font-bold text-text-main">{data.summary.totalChannels}</span>
          </div>
          <div className="bg-card-bg border border-border-light rounded-xl p-4 flex flex-col justify-center">
            <span className="text-[13px] text-[#6B7280] font-medium mb-1 uppercase tracking-[0.08em]">Active</span>
            <span className="text-[24px] lg:text-[28px] font-bold text-[#00FF88]">{data.summary.enabledChannels}</span>
          </div>
          <div className="bg-card-bg border border-border-light rounded-xl p-4 flex flex-col justify-center">
            <span className="text-[13px] text-[#6B7280] font-medium mb-1 uppercase tracking-[0.08em]">Total Messages</span>
            <span className="text-[24px] lg:text-[28px] font-bold text-[#00D4FF]">{formatMessages(data.summary.totalMessages)}</span>
          </div>
          <div className="bg-card-bg border border-border-light rounded-xl p-4 flex flex-col justify-center">
            <span className="text-[13px] text-[#6B7280] font-medium mb-1 uppercase tracking-[0.08em]">Recent (24h)</span>
            <span className="text-[24px] lg:text-[28px] font-bold text-text-main">{formatMessages(data.summary.recentMessages)}</span>
          </div>
        </div>
      )}

      {/* Filters (Search & Selects using pill style) */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 h-auto">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[44px] pl-12 pr-4 bg-card-bg border border-border-light rounded-full text-[14px] text-text-main placeholder:text-[#6B7280] focus-visible:ring-1 focus-visible:ring-[#00D4FF]/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-[44px] bg-card-bg border border-border-light rounded-full text-text-main text-[14px] px-5 focus:ring-1 focus:ring-[#00D4FF]/50">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card-bg border-border-light text-text-main">
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="enabled">Enabled Only</SelectItem>
            <SelectItem value="disabled">Disabled Only</SelectItem>
          </SelectContent>
        </Select>
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
            onClick={fetchTelegramData}
            variant="outline"
            size="sm"
            className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-iris-primary/20 border-t-iris-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading Telegram channels...</p>
        </div>
      )}

      {/* Channels Table (Desktop) / Grid (Mobile) */}
      {!loading && filteredChannels.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block w-full bg-card-bg border border-border-light rounded-xl overflow-x-auto relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#00D4FF]/40 to-transparent"></div>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] whitespace-nowrap">Channel</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] whitespace-nowrap">Messages</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] whitespace-nowrap">Last Activity</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredChannels.slice(0, visibleChannels).map((channel) => (
                  <tr key={channel.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0052FF] flex items-center justify-center text-text-main font-bold text-xs shrink-0">
                          {channel.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-semibold text-text-main whitespace-nowrap transition-colors group-hover:text-[#00D4FF]">@{channel.username}</span>
                          {channel.display_name && (
                            <span className="text-[12px] text-[#6B7280] truncate max-w-[150px]">{channel.display_name}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span className="text-[13px] font-medium text-text-main">{formatMessages(channel.stats.totalMessages)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {channel.enabled ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#00FF88]/10 border border-[#00FF88]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse"></span>
                          <span className="text-[11px] font-semibold text-[#00FF88] uppercase tracking-wider">Active</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#6B7280]/10 border border-[#6B7280]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]"></span>
                          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Paused</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-[#6B7280]">
                        <Clock className="w-3.5 h-3.5" />
                        {formatLastMessage(channel.stats.lastMessageAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Switch
                          checked={channel.enabled}
                          onCheckedChange={() => handleToggleChannel(channel)}
                          className="data-[state=checked]:bg-[#00D4FF]"
                        />
                        <a 
                          href={`https://t.me/${channel.username}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 text-text-main transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {filteredChannels.slice(0, visibleChannels).map((channel) => (
              <div
                key={channel.id}
                className="bg-card-bg border border-border-light rounded-xl overflow-hidden flex flex-col p-4 w-full"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00D4FF] to-[#0052FF] rounded-full flex items-center justify-center text-text-main font-bold text-sm shrink-0">
                      {channel.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-main truncate text-[14px]">@{channel.username}</p>
                      {channel.display_name && (
                        <p className="text-[12px] text-[#6B7280] truncate">
                          {channel.display_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {channel.enabled ? (
                    <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded bg-[#00FF88]/10 border border-[#00FF88]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse"></span>
                      <span className="text-[10px] font-semibold text-[#00FF88] uppercase tracking-wider">Active</span>
                    </div>
                  ) : (
                    <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded bg-[#6B7280]/10 border border-[#6B7280]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]"></span>
                      <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Paused</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="h-4 w-4 text-[#6B7280] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-text-main font-medium truncate">{formatMessages(channel.stats.totalMessages)}</p>
                      <p className="text-[11px] text-[#6B7280]">messages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-4 w-4 text-[#6B7280] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-text-main font-medium truncate">{formatLastMessage(channel.stats.lastMessageAt)}</p>
                      <p className="text-[11px] text-[#6B7280]">last activity</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-light">
                  <Switch
                    checked={channel.enabled}
                    onCheckedChange={() => handleToggleChannel(channel)}
                    className="data-[state=checked]:bg-[#00D4FF] shrink-0"
                  />
                  <a 
                    href={`https://t.me/${channel.username}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 flex items-center justify-center gap-1.5 rounded bg-foreground/5 hover:bg-foreground/10 text-text-main transition-colors text-[12px] font-medium"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span>View Channel</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Load More */}
      {!loading && filteredChannels.length > visibleChannels && (
        <div className="text-center mt-8">
          <Button 
            onClick={handleLoadMore}
            variant="outline" 
            className="border-iris-primary/30 text-text-main hover:bg-primary/10"
          >
            Load More Channels ({filteredChannels.length - visibleChannels} remaining)
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredChannels.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-text-main" />
          </div>
          <h3 className="text-lg font-semibold text-text-main mb-2 meme-comic">No Active Telegram Channels Found</h3>
          <p className="text-text-secondary mb-4 meme-body">
            {searchTerm ? 'Try adjusting your search terms' : 'Only channels with messages are shown. Add channels and wait for data collection!'}
          </p>
          {!searchTerm && (
            <div className="space-y-2 text-sm text-text-secondary">
              <p>• Add channels to your scraper configuration</p>
              <p>• Check if your scraper is running</p>
              <p>• Verify database connection</p>
            </div>
          )}
          <Button
            onClick={fetchTelegramData}
            className="mt-4 bg-primary hover:bg-primary/80 text-black"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

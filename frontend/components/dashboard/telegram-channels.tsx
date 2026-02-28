'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  EyeOff
} from 'lucide-react';
import { telegramChannelsService, TelegramChannelsData, TelegramChannel } from '@/lib/telegram-channels-service';

interface TelegramChannelsProps {
  className?: string;
}

export default function TelegramChannels({ className }: TelegramChannelsProps) {
  const [data, setData] = useState<TelegramChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0
  });

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeService = async () => {
      try {
        setLoading(true);
        setError(null);

        // Subscribe to real-time updates
        unsubscribe = telegramChannelsService.subscribe((newData) => {
          setData(newData);
          setLoading(false);
        });

        // Update connection status
        const updateConnectionStatus = () => {
          setConnectionStatus(telegramChannelsService.getConnectionStatus());
        };

        updateConnectionStatus();
        const statusInterval = setInterval(updateConnectionStatus, 1000);

        // Initial fetch
        const initialData = await telegramChannelsService.fetchChannels();
        if (initialData) {
          setData(initialData);
        }

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
  }, []);

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

  const filteredChannels = data?.channels.filter(channel => {
    const matchesSearch = channel.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && channel.enabled) ||
                         (statusFilter === 'disabled' && !channel.enabled);
    
    const hasMessages = channel.stats.totalMessages > 0;
    
    return matchesSearch && matchesStatus && hasMessages;
  }) || [];

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

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telegram Channels
          </CardTitle>
          <CardDescription>Loading Telegram channels...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telegram Channels
          </CardTitle>
          <CardDescription>Error loading channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Telegram Channels
              <span className={`text-sm font-normal ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
            </CardTitle>
            <CardDescription>
              Manage and monitor Telegram channels
            </CardDescription>
          </div>
          {data && (
            <div className="flex gap-2">
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {data.summary.totalChannels} Total
              </Badge>
              <Badge variant="outline" className="text-green-600">
                <Activity className="h-3 w-3 mr-1" />
                {data.summary.enabledChannels} Active
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.summary.totalChannels}</div>
              <div className="text-sm text-text-secondary">Total Channels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.summary.enabledChannels}</div>
              <div className="text-sm text-text-secondary">Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.summary.totalMessages.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Total Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.summary.recentMessages.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Recent (24h)</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="enabled">Enabled Only</SelectItem>
              <SelectItem value="disabled">Disabled Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Channels List */}
        <div className="space-y-3">
          {filteredChannels.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active channels found</p>
              {searchTerm ? (
                <p className="text-sm">Try adjusting your search terms</p>
              ) : (
                <p className="text-sm">Only channels with messages are shown</p>
              )}
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <div
                key={channel.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">
                        @{channel.username}
                      </h3>
                      {channel.display_name && (
                        <span className="text-text-secondary text-sm truncate">
                          ({channel.display_name})
                        </span>
                      )}
                      <Badge variant={channel.enabled ? "default" : "secondary"}>
                        {channel.enabled ? (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Paused
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {channel.stats.totalMessages.toLocaleString()} messages
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatLastMessage(channel.stats.lastMessageAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        Every {channel.scrape_interval_minutes}m
                      </div>
                      <div className="flex items-center gap-1">
                        {channel.scrape_media ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {channel.scrape_media ? 'Media' : 'Text only'}
                      </div>
                    </div>

                    {channel.stats.lastMessagePreview && (
                      <div className="mt-2 text-xs text-text-secondary bg-muted/50 p-2 rounded">
                        <strong>Last message:</strong> {channel.stats.lastMessagePreview}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => handleToggleChannel(channel)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://t.me/${channel.username}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Last Updated */}
        {data && (
          <div className="text-xs text-text-secondary text-center pt-4 border-t">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Search, Filter, X } from 'lucide-react';
import { realTimeService } from '@/lib/real-time-service';

interface TrendingCoinsData {
  coins: any[];
  total: number;
  sortBy: string;
  limit: number;
}

export default function TrendingCoinsAnalytics() {
  const [data, setData] = useState<TrendingCoinsData>({ coins: [], total: 0, sortBy: 'correlation', limit: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('correlation');
  const [limit, setLimit] = useState(20);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [lastUpdated, setLastUpdated] = useState<string>('--');
  const [isClient, setIsClient] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarketCap, setFilterMarketCap] = useState<string>('all');
  const [filterCorrelation, setFilterCorrelation] = useState<string>('all');
  const [filterViews, setFilterViews] = useState<string>('all');

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
  }, []);

  const fetchTrendingCoins = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dashboard/trending-coins?sortBy=${sortBy}&limit=${limit}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
        // Update time on client side only
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching trending coins:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, limit]);

  useEffect(() => {
    // Only fetch data after we're on the client side
    if (!isClient) return;
    
    fetchTrendingCoins();
    
    // Subscribe to real-time trending updates only if service is available
    if (realTimeService) {
      const unsubscribeTrending = realTimeService.subscribe('trending_update', (newData) => {
        // Update data when new trending coin data arrives
        fetchTrendingCoins();
        // Update time on client side only
        setLastUpdated(new Date().toLocaleTimeString());
      });

      // Cleanup subscription
      return () => {
        unsubscribeTrending();
      };
    }
  }, [isClient, sortBy, limit, fetchTrendingCoins]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatCorrelation = (score: number): string => {
    return `${(score * 100).toFixed(1)}%`;
  };

  const getCorrelationColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCorrelationBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    if (score >= 0.4) return 'outline';
    return 'destructive';
  };

  // Filtered and searched data - Remove coins with all zero values
  const filteredCoins = useMemo(() => {
    let filtered = [...data.coins];

    // First, remove coins with all zero values (no meaningful data)
    filtered = filtered.filter(coin => {
      const hasVolume = (coin.trading_volume_24h || 0) > 0;
      const hasViews = (coin.tiktok_views_24h || 0) > 0;
      const hasCorrelation = (coin.correlation_score || 0) > 0;
      const hasMarketCap = (coin.market_cap || 0) > 0;
      const hasMentions = (coin.total_mentions || 0) > 0;
      
      // Keep coin if it has at least one meaningful metric
      return hasVolume || hasViews || hasCorrelation || hasMarketCap || hasMentions;
    });

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(coin => 
        coin.symbol?.toLowerCase().includes(query) ||
        coin.name?.toLowerCase().includes(query) ||
        coin.address?.toLowerCase().includes(query)
      );
    }

    // Market cap filter
    if (filterMarketCap !== 'all') {
      switch (filterMarketCap) {
        case 'high':
          filtered = filtered.filter(coin => (coin.market_cap || 0) >= 1000000);
          break;
        case 'medium':
          filtered = filtered.filter(coin => (coin.market_cap || 0) >= 100000 && (coin.market_cap || 0) < 1000000);
          break;
        case 'low':
          filtered = filtered.filter(coin => (coin.market_cap || 0) < 100000);
          break;
      }
    }

    // Correlation filter
    if (filterCorrelation !== 'all') {
      switch (filterCorrelation) {
        case 'high':
          filtered = filtered.filter(coin => (coin.correlation_score || 0) >= 0.8);
          break;
        case 'medium':
          filtered = filtered.filter(coin => (coin.correlation_score || 0) >= 0.6 && (coin.correlation_score || 0) < 0.8);
          break;
        case 'low':
          filtered = filtered.filter(coin => (coin.correlation_score || 0) < 0.6);
          break;
      }
    }

    // Views filter
    if (filterViews !== 'all') {
      switch (filterViews) {
        case 'high':
          filtered = filtered.filter(coin => (coin.tiktok_views_24h || 0) >= 10000);
          break;
        case 'medium':
          filtered = filtered.filter(coin => (coin.tiktok_views_24h || 0) >= 1000 && (coin.tiktok_views_24h || 0) < 10000);
          break;
        case 'low':
          filtered = filtered.filter(coin => (coin.tiktok_views_24h || 0) < 1000);
          break;
      }
    }

    return filtered;
  }, [data.coins, searchQuery, filterMarketCap, filterCorrelation, filterViews]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterMarketCap('all');
    setFilterCorrelation('all');
    setFilterViews('all');
  };

  const formatSupply = (supply: number): string => {
    if (supply >= 1000000000) {
      return `${(supply / 1000000000).toFixed(2)}B`;
    } else if (supply >= 1000000) {
      return `${(supply / 1000000000).toFixed(2)}M`;
    } else if (supply >= 1000) {
      return `${(supply / 1000).toFixed(2)}K`;
    }
    return supply.toString();
  };

  if (isLoading || !isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trending Coins Analytics</CardTitle>
          <CardDescription>Loading trending coins data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-muted rounded animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show "no data" state when there are no coins
  if (!isLoading && data.coins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trending Coins Analytics</CardTitle>
          <CardDescription>No trending coins data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Trending Coins Found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              No trending coins data is currently available. This could be because:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 text-left max-w-md mx-auto mb-6">
              <li>• The database is not populated with token data</li>
              <li>• Price data collection is not running</li>
              <li>• TikTok scraper is not collecting data</li>
              <li>• No recent activity in the last 24 hours</li>
            </ul>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                To start seeing trending coins data:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Run the Token & Price Data (Jupiter) collection from Dashboard → Backend Services</li>
                <li>• Start the TikTok scraper</li>
                <li>• Ensure database tables are populated</li>
                <li>• Check that all services are running</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Trending Coins Analytics</CardTitle>
            <CardDescription>
              Real-time analysis of trending memecoins with live updates
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correlation">Correlation</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="mentions">Mentions</SelectItem>
                <SelectItem value="market_cap">Market Cap</SelectItem>
              </SelectContent>
            </Select>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filteredCoins.length} of {data.total} coins</span>
          <span>Last updated: {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by symbol, name, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filterMarketCap} onValueChange={setFilterMarketCap}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Market Cap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Market Caps</SelectItem>
                <SelectItem value="high">High (≥$1M)</SelectItem>
                <SelectItem value="medium">Medium ($100K-$1M)</SelectItem>
                <SelectItem value="low">Low (&lt;$100K)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCorrelation} onValueChange={setFilterCorrelation}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Correlation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Correlations</SelectItem>
                <SelectItem value="high">High (≥80%)</SelectItem>
                <SelectItem value="medium">Medium (60-80%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterViews} onValueChange={setFilterViews}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Views" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Views</SelectItem>
                <SelectItem value="high">High (≥10K)</SelectItem>
                <SelectItem value="medium">Medium (1K-10K)</SelectItem>
                <SelectItem value="low">Low (&lt;1K)</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || filterMarketCap !== 'all' || filterCorrelation !== 'all' || filterViews !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(searchQuery || filterMarketCap !== 'all' || filterCorrelation !== 'all' || filterViews !== 'all') && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: &quot;{searchQuery}&quot;
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              )}
              {filterMarketCap !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Market Cap: {filterMarketCap}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setFilterMarketCap('all')}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              )}
              {filterCorrelation !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Correlation: {filterCorrelation}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setFilterCorrelation('all')}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              )}
              {filterViews !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Views: {filterViews}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setFilterViews('all')}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="correlation">Correlation</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
          </TabsList>

          {/* No Results Message */}
          {filteredCoins.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">
                {searchQuery ? `No coins found matching "${searchQuery}"` : 'No coins match the current filters'}
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {filteredCoins.slice(0, 10).map((coin, index) => (
                <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                        <h3 className="font-semibold">{coin.symbol}</h3>
                      {(coin.trading_volume_24h || 0) > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Volume: {formatCurrency(coin.trading_volume_24h)}
                        </p>
                      )}
                      {coin.market_cap && coin.market_cap > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Market Cap: {formatCurrency(coin.market_cap)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {(coin.correlation_score || 0) > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-medium">Correlation</p>
                        <p className={`text-lg font-bold ${getCorrelationColor(coin.correlation_score)}`}>
                          {formatCorrelation(coin.correlation_score)}
                        </p>
                      </div>
                    )}
                    {(coin.tiktok_views_24h || 0) > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-medium">Views</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatViews(coin.tiktok_views_24h)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="correlation" className="space-y-4">
            <div className="grid gap-4">
              {filteredCoins
                .sort((a, b) => b.correlation_score - a.correlation_score)
                .slice(0, 10)
                .map((coin, index) => (
                  <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                        <div>
                          <h3 className="font-semibold">{coin.symbol}</h3>
                        {(coin.trading_volume_24h || 0) > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Volume: {formatCurrency(coin.trading_volume_24h)}
                          </p>
                        )}
                        {coin.market_cap && coin.market_cap > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Market Cap: {formatCurrency(coin.market_cap)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {(coin.correlation_score || 0) > 0 && (
                        <Badge variant={getCorrelationBadgeVariant(coin.correlation_score)}>
                          {formatCorrelation(coin.correlation_score)}
                        </Badge>
                      )}
                      {(coin.tiktok_views_24h || 0) > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Views</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatViews(coin.tiktok_views_24h)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid gap-4">
              {filteredCoins
                .sort((a, b) => b.tiktok_views_24h - a.tiktok_views_24h)
                .slice(0, 10)
                .map((coin, index) => (
                  <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                        <div>
                          <h3 className="font-semibold">{coin.symbol}</h3>
                        {(coin.correlation_score || 0) > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Correlation: {formatCorrelation(coin.correlation_score)}
                          </p>
                        )}
                        {coin.market_cap && coin.market_cap > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Market Cap: {formatCurrency(coin.market_cap)}
                          </p>
                        )}
                      </div>
                        </div>
                    <div className="flex items-center gap-4">
                      {(coin.tiktok_views_24h || 0) > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Views</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatViews(coin.tiktok_views_24h)}
                          </p>
                        </div>
                      )}
                      {(coin.total_mentions || 0) > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Mentions</p>
                          <p className="text-lg font-bold text-purple-600">
                            {coin.total_mentions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <div className="grid gap-4">
              {filteredCoins
                .filter(coin => coin.market_cap || coin.total_supply)
                .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
                .slice(0, 10)
                .map((coin, index) => (
                  <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{coin.symbol}</h3>
                        <p className="text-sm text-muted-foreground">
                          {coin.name || 'Unknown Token'}
                        </p>
                        {coin.address && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {coin.address.slice(0, 8)}...{coin.address.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {coin.market_cap && coin.market_cap > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Market Cap</p>
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(coin.market_cap)}
                          </p>
                        </div>
                      )}
                      {coin.total_supply && coin.total_supply > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Total Supply</p>
                          <p className="text-lg font-bold text-orange-600">
                            {formatSupply(coin.total_supply)}
                          </p>
                        </div>
                      )}
                      {coin.last_updated && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(coin.last_updated).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Coins, Hash } from 'lucide-react';

interface MarketDataCardProps {
  token: {
    symbol: string;
    name: string;
    uri: string;
    address?: string;
    market_cap?: number;
    total_supply?: number;
    last_updated?: string;
    decimals?: number;
    latest_price_usd?: number;
    latest_price_sol?: number;
  };
}

export default function MarketDataCard({ token }: MarketDataCardProps) {
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatSupply = (supply: number): string => {
    if (supply >= 1000000000) {
      return `${(supply / 1000000000).toFixed(2)}B`;
    } else if (supply >= 1000000) {
      return `${(supply / 1000000).toFixed(2)}M`;
    } else if (supply >= 1000) {
      return `${(supply / 1000).toFixed(2)}K`;
    }
    return supply.toString();
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getMarketCapColor = (marketCap?: number): string => {
    if (!marketCap) return 'text-text-secondary';
    if (marketCap >= 1000000) return 'text-green-600';
    if (marketCap >= 100000) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{token.symbol}</CardTitle>
            <CardDescription className="text-sm">
              {token.name || 'Unknown Token'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Market Data
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Cap */}
        {token.market_cap && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Market Cap</span>
            </div>
            <span className={`text-lg font-bold ${getMarketCapColor(token.market_cap)}`}>
              {formatCurrency(token.market_cap)}
            </span>
          </div>
        )}

        {/* Total Supply */}
        {token.total_supply && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Supply</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
              {formatSupply(token.total_supply)}
            </span>
          </div>
        )}

        {/* Price Information */}
        {(token.latest_price_usd || token.latest_price_sol) && (
          <div className="grid grid-cols-2 gap-3">
            {token.latest_price_usd && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium">USD Price</span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(token.latest_price_usd)}
                </span>
              </div>
            )}
            {token.latest_price_sol && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-3 w-3 text-purple-600" />
                  <span className="text-xs font-medium">SOL Price</span>
                </div>
                <span className="text-sm font-bold text-purple-600">
                  {token.latest_price_sol.toFixed(6)} SOL
                </span>
              </div>
            )}
          </div>
        )}

        {/* Token Details */}
        <div className="space-y-2 pt-2 border-t">
          {token.address && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Address:</span>
              <span className="font-mono text-text-secondary">
                {token.address.slice(0, 8)}...{token.address.slice(-8)}
              </span>
            </div>
          )}
          {token.decimals && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Decimals:</span>
              <span className="font-medium">{token.decimals}</span>
            </div>
          )}
          {token.last_updated && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Last Updated:</span>
              <span className="font-medium">{formatDate(token.last_updated)}</span>
            </div>
          )}
        </div>

        {/* Token URI */}
        <div className="pt-2 border-t">
          <div className="text-xs">
            <span className="text-text-secondary">URI: </span>
            <span className="font-mono text-blue-600 break-all">
              {token.uri}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// export const dynamic = 'force-dynamic'; // Disabled for static export

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { TrendingCoin } from '@/lib/types';


const supabase = createClient(
  process.env.SUPABASE_URL || 'https://srsapzqvwxgrohisrwnm.supabase.co',
  process.env.SUPABASE_ANON_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc2FwenF2d3hncm9oaXNyd25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODg4MTUsImV4cCI6MjA2NzM2NDgxNX0.IGGaJcpeEGj-Y7Drb-HRvSL7bnsJdX1dFrHtvnfyKLI'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'correlation'; // correlation, volume, views

    // Get 24-hour ago timestamp
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Fetch tokens with recent price data (Jupiter + scraper; address = mint for Jupiter)
    const { data: tokens, error: tokensError } = await supabase
      .from('tokens')
      .select(`
        id,
        uri,
        address,
        symbol,
        name,
        market_cap,
        total_supply,
        last_updated
      `)
      .not('uri', 'is', null);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    // Fetch 24-hour price data for volume and optional price_change_24h (Jupiter stores it)
    const { data: prices, error: pricesError } = await supabase
      .from('prices')
      .select(`
        token_uri,
        price_usd,
        price_change_24h,
        timestamp
      `)
      .gte('timestamp', twentyFourHoursAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
      return NextResponse.json(
        { error: 'Failed to fetch price data' },
        { status: 500 }
      );
    }

    // Fetch 24-hour TikTok data for view counts
    const { data: tiktoks, error: tiktoksError } = await supabase
      .from('tiktoks')
      .select(`
        id,
        views,
        fetched_at
      `)
      .gte('fetched_at', twentyFourHoursAgo.toISOString());

    if (tiktoksError) {
      console.error('Error fetching TikTok data:', tiktoksError);
      return NextResponse.json(
        { error: 'Failed to fetch TikTok data' },
        { status: 500 }
      );
    }

    // Fetch mentions data separately
    const { data: mentions, error: mentionsError } = await supabase
      .from('mentions')
      .select(`
        tiktok_id,
        token_id,
        count
      `);

    if (mentionsError) {
      console.error('Error fetching mentions data:', mentionsError);
      return NextResponse.json(
        { error: 'Failed to fetch mentions data' },
        { status: 500 }
      );
    }

    // Process and calculate metrics for each token
    const trendingCoins: TrendingCoin[] = tokens.map(token => {
      // Calculate 24-hour trading volume from price data
      const tokenPrices = prices.filter(p => p.token_uri === token.uri);
      const tradingVolume24h = calculateTradingVolume(tokenPrices);
      
      // Calculate 24-hour TikTok views using mentions table
      const tokenMentions = mentions.filter(m => {
        // Find the token by URI to get its ID
        return m.token_id && tokens.find(t => t.uri === token.uri)?.id === m.token_id;
      });
      
      const tokenTiktokIds = tokenMentions.map(m => m.tiktok_id);
      const tokenTiktoks = tiktoks.filter(t => tokenTiktokIds.includes(t.id));
      const tiktokViews24h = tokenTiktoks.reduce((sum, t) => sum + (t.views || 0), 0);
      
      // Calculate correlation score between volume and social activity
      const correlationScore = calculateCorrelation(tradingVolume24h, tiktokViews24h);
      
      // Use stored price_change_24h from Jupiter when available; else derive from price history
      const latestPriceRow = tokenPrices[0];
      const priceChange24h =
        latestPriceRow?.price_change_24h != null
          ? Number(latestPriceRow.price_change_24h) * 100
          : calculatePriceChange(tokenPrices);

      const totalMentions = tokenMentions.reduce((sum, m) => sum + (m.count || 1), 0);

      return {
        uri: token.uri,
        symbol: token.symbol || 'Unknown',
        name: token.name || 'Unknown',
        trading_volume_24h: tradingVolume24h,
        tiktok_views_24h: tiktokViews24h,
        correlation_score: correlationScore,
        price_change_24h: priceChange24h,
        total_mentions: totalMentions,
        market_cap: token.market_cap,
        total_supply: token.total_supply,
        address: token.address ?? undefined,
        decimals: 9,
        last_updated: token.last_updated || new Date().toISOString()
      };
    });

    // Sort based on the requested criteria
    let sortedCoins = [...trendingCoins];
    switch (sortBy) {
      case 'correlation':
        sortedCoins.sort((a, b) => b.correlation_score - a.correlation_score);
        break;
      case 'volume':
        sortedCoins.sort((a, b) => b.trading_volume_24h - a.trading_volume_24h);
        break;
      case 'views':
        sortedCoins.sort((a, b) => b.tiktok_views_24h - a.tiktok_views_24h);
        break;
      case 'market_cap':
        sortedCoins.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
        break;
      default:
        sortedCoins.sort((a, b) => b.correlation_score - a.correlation_score);
    }

    // Apply limit
    const limitedCoins = sortedCoins.slice(0, limit);

    return NextResponse.json({
      coins: limitedCoins,
      total: trendingCoins.length,
      sortBy,
      limit
    });

  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending coins' },
      { status: 500 }
    );
  }
}

// Helper function to calculate trading volume from price data
function calculateTradingVolume(prices: any[]): number {
  if (prices.length < 2) return 0;
  
  // Sort by timestamp
  const sortedPrices = prices.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Calculate volume based on price changes and estimated trade frequency
  let volume = 0;
  for (let i = 1; i < sortedPrices.length; i++) {
    const priceChange = Math.abs(sortedPrices[i].price_usd - sortedPrices[i-1].price_usd);
    const timeDiff = new Date(sortedPrices[i].timestamp).getTime() - 
                     new Date(sortedPrices[i-1].timestamp).getTime();
    
    // Estimate volume based on price volatility and time
    const estimatedVolume = priceChange * 1000 * (timeDiff / (1000 * 60 * 60)); // Base volume per hour
    volume += estimatedVolume;
  }
  
  return Math.round(volume);
}

// Helper function to calculate price change percentage
function calculatePriceChange(prices: any[]): number {
  if (prices.length < 2) return 0;
  
  const sortedPrices = prices.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  const firstPrice = sortedPrices[0].price_usd;
  const lastPrice = sortedPrices[sortedPrices.length - 1].price_usd;
  
  if (firstPrice === 0) return 0;
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

// Helper function to calculate correlation between volume and social activity
function calculateCorrelation(volume: number, views: number): number {
  if (volume === 0 || views === 0) return 0;
  
  // Simple correlation calculation based on relative scales
  const volumeScore = Math.min(volume / 10000, 1); // Normalize to 0-1
  const viewsScore = Math.min(views / 100000, 1); // Normalize to 0-1
  
  // Calculate correlation based on how well they align
  const correlation = (volumeScore + viewsScore) / 2;
  
  // Boost correlation if both metrics are high
  if (volumeScore > 0.7 && viewsScore > 0.7) {
    return Math.min(correlation * 1.5, 1);
  }
  
  return correlation;
}

// Database Integration for ElizaOS Agents - Fetches real trending data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseIntegration {
  constructor() {
    this.supabase = null;
    this.isConfigured = false;
    this.initialize();
  }

  // Initialize Supabase client (SUPABASE_ANON_SECRET or SUPABASE_ANON_KEY, same as frontend)
  initialize() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_SECRET || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.log('⚠️ Supabase credentials not configured');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isConfigured = true;
      console.log('✅ Database integration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database integration:', error);
    }
  }

  // Get trending tokens from database
  async getTrendingTokens(limit = 5) {
    if (!this.isConfigured) {
      console.log('⚠️ Database not configured, returning sample data');
      return this.getSampleTrendingData();
    }

    try {
      console.log('🔍 Fetching trending tokens from database...');
      
      // Get tokens with recent price data and high mentions
      const { data: tokens, error } = await this.supabase
        .from('tokens')
        .select(`
          id,
          name,
          symbol,
          uri,
          views,
          mentions,
          created_at,
          prices!inner(price_usd, price_sol, is_latest, trade_at)
        `)
        .eq('prices.is_latest', true)
        .gt('mentions', 0)
        .order('mentions', { ascending: false })
        .order('views', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Database error:', error);
        return this.getSampleTrendingData();
      }

      if (!tokens || tokens.length === 0) {
        console.log('⚠️ No trending tokens found, returning sample data');
        return this.getSampleTrendingData();
      }

      console.log(`✅ Found ${tokens.length} trending tokens`);
      
      // Format the data for Twitter bot
      return tokens.map(token => ({
        token: `$${token.symbol}`,
        name: token.name,
        price: token.prices?.[0]?.price_usd || 0,
        priceSol: token.prices?.[0]?.price_sol || 0,
        volume: this.calculateVolume(token.prices?.[0]?.price_usd || 0),
        hashtags: this.generateHashtags(token.symbol, token.name),
        mentions: token.mentions,
        views: token.views,
        createdAt: token.created_at
      }));

    } catch (error) {
      console.error('❌ Error fetching trending tokens:', error);
      return this.getSampleTrendingData();
    }
  }

  // Get TikTok trending hashtags
  async getTrendingHashtags(limit = 10) {
    if (!this.isConfigured) {
      return ['#solana', '#memecoin', '#pump', '#crypto'];
    }

    try {
      console.log('🔍 Fetching trending TikTok hashtags...');
      
      const { data: tiktoks, error } = await this.supabase
        .from('tiktoks')
        .select('hashtags, views, fetched_at')
        .not('hashtags', 'is', null)
        .order('views', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Database error:', error);
        return ['#solana', '#memecoin', '#pump', '#crypto'];
      }

      // Extract and count hashtags
      const hashtagCounts = {};
      tiktoks?.forEach(tiktok => {
        if (tiktok.hashtags) {
          const hashtags = tiktok.hashtags.split(',').map(h => h.trim());
          hashtags.forEach(hashtag => {
            if (hashtag.startsWith('#')) {
              hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
            }
          });
        }
      });

      // Return top hashtags
      return Object.entries(hashtagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([hashtag]) => hashtag);

    } catch (error) {
      console.error('❌ Error fetching trending hashtags:', error);
      return ['#solana', '#memecoin', '#pump', '#crypto'];
    }
  }

  // Get market analysis data
  async getMarketAnalysis() {
    if (!this.isConfigured) {
      return {
        summary: 'Strong bullish momentum detected across multiple memecoins with high TikTok engagement',
        recommendation: 'Consider small positions in trending tokens with proper risk management',
        confidence: 0.75
      };
    }

    try {
      console.log('🔍 Fetching market analysis data...');
      
      // Get recent price movements
      const { data: recentPrices, error } = await this.supabase
        .from('prices')
        .select('price_usd, trade_at, token_id')
        .eq('is_latest', true)
        .order('trade_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Database error:', error);
        return this.getSampleMarketAnalysis();
      }

      // Analyze price trends
      const analysis = this.analyzePriceTrends(recentPrices);
      
      console.log('✅ Market analysis generated');
      return analysis;

    } catch (error) {
      console.error('❌ Error fetching market analysis:', error);
      return this.getSampleMarketAnalysis();
    }
  }

  // Analyze price trends
  analyzePriceTrends(prices) {
    if (!prices || prices.length < 2) {
      return this.getSampleMarketAnalysis();
    }

    // Simple trend analysis
    const priceChanges = prices.slice(0, 10).map(p => p.price_usd);
    const avgPrice = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const volatility = Math.max(...priceChanges) - Math.min(...priceChanges);
    
    let sentiment = 'neutral';
    let recommendation = 'Hold current positions';
    let confidence = 0.5;

    if (volatility > avgPrice * 0.1) {
      sentiment = 'high-volatility';
      recommendation = 'High volatility detected - use caution';
      confidence = 0.6;
    } else if (avgPrice > 0.00001) {
      sentiment = 'bullish';
      recommendation = 'Consider small positions in trending tokens';
      confidence = 0.7;
    }

    return {
      summary: `${sentiment} market conditions with ${volatility > avgPrice * 0.1 ? 'high' : 'moderate'} volatility`,
      recommendation,
      confidence,
      avgPrice,
      volatility
    };
  }

  // Calculate volume estimate based on price
  calculateVolume(price) {
    if (!price || price === 0) return 0;
    
    // Simple volume calculation based on price
    // Higher price = higher volume estimate
    const baseVolume = 100000;
    const multiplier = Math.min(price * 10000000, 10); // Cap at 10x
    return Math.round(baseVolume * multiplier);
  }

  // Generate relevant hashtags
  generateHashtags(symbol, name) {
    const hashtags = ['#solana', '#memecoin'];
    
    if (symbol) {
      hashtags.push(`#${symbol.toLowerCase()}`);
    }
    
    if (name && name.toLowerCase().includes('pump')) {
      hashtags.push('#pump');
    }
    
    if (name && name.toLowerCase().includes('fun')) {
      hashtags.push('#pumpfun');
    }
    
    hashtags.push('#crypto', '#trading');
    
    return hashtags.slice(0, 5); // Limit to 5 hashtags
  }

  // Sample data fallbacks
  getSampleTrendingData() {
    return [{
      token: '$BONK',
      name: 'Bonk',
      price: 0.000012,
      priceSol: 0.0000005,
      volume: 1250000,
      hashtags: ['#solana', '#pump', '#memecoin', '#pumpfun'],
      mentions: 150,
      views: 50000,
      createdAt: new Date().toISOString()
    }];
  }

  getSampleMarketAnalysis() {
    return {
      summary: 'Strong bullish momentum detected across multiple memecoins with high TikTok engagement',
      recommendation: 'Consider small positions in trending tokens with proper risk management',
      confidence: 0.75
    };
  }

  // Get agent status
  getStatus() {
    return {
      name: 'Database Integration',
      configured: this.isConfigured,
      status: this.isConfigured ? 'active' : 'inactive'
    };
  }
}

export default DatabaseIntegration;

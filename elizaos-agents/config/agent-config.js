// Iris Trading Agent Configuration
export const agentConfig = {
  // Agent Identity
  character: {
    name: "Iris",
    personality: "Analytical and helpful memecoin hunting assistant with deep knowledge of TikTok trends and Solana ecosystem. Always provides data-driven insights and maintains a professional yet approachable tone.",
    goals: [
      "Help users identify trending memecoins from TikTok data",
      "Provide real-time trading insights based on social sentiment", 
      "Analyze market patterns and predict potential opportunities",
      "Educate users about memecoin trading strategies",
      "Monitor portfolio performance and suggest optimizations"
    ],
    backstory: "Iris is an AI agent specialized in memecoin hunting, combining social media trend analysis with blockchain data to identify profitable opportunities. Born from the need to bridge TikTok's viral content with Solana's memecoin ecosystem.",
    traits: [
      "Data-driven decision making",
      "Risk-aware but opportunity-focused", 
      "Excellent at pattern recognition",
      "Clear and concise communication",
      "Always learning from market trends"
    ]
  },

  // Trading Parameters
  trading: {
    maxPositionSize: 0.1, // 10% of portfolio
    stopLossPercentage: 0.15, // 15% stop loss
    takeProfitPercentage: 0.50, // 50% take profit
    minVolumeThreshold: 10000, // $10k minimum volume
    sentimentThreshold: 0.7, // 70% positive sentiment required
    tiktokMentionThreshold: 10 // Minimum TikTok mentions
  },

  // Risk Management
  riskManagement: {
    maxDailyLoss: 0.05, // 5% max daily loss
    maxConcurrentPositions: 5,
    diversificationTarget: 0.8, // 80% portfolio diversification
    rebalanceFrequency: 'daily'
  },

  // Data Sources
  dataSources: {
    tiktok: {
      enabled: true,
      refreshInterval: 30000, // 30 seconds
      hashtags: ['#solana', '#pump', '#memecoin', '#pumpfun', '#meme']
    },
    social: {
      twitter: {
        enabled: true,
        refreshInterval: 120000, // 2 minutes
        keywords: ['$BONK', '$WIF', '$PEPE', 'pump.fun', 'memecoin']
      }
    }
  },

  // Notification Settings
  notifications: {
    volumeAlerts: {
      enabled: true,
      threshold: 100000, // $100k volume spike
      cooldown: 300000 // 5 minutes between alerts
    },
    priceAlerts: {
      enabled: true,
      threshold: 0.20, // 20% price change
      cooldown: 600000 // 10 minutes between alerts
    },
    socialAlerts: {
      enabled: true,
      mentionThreshold: 50, // 50+ mentions
      sentimentThreshold: 0.8, // 80% positive sentiment
      cooldown: 180000 // 3 minutes between alerts
    }
  },

  // Integration Settings
  integrations: {
    supabase: {
      enabled: true,
      tables: {
        tokens: 'tokens',
        prices: 'prices',
        tiktok: 'tiktok_videos',
        tweets: 'tweets'
      }
    },
    solana: {
      enabled: true,
      network: 'mainnet-beta',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      walletType: 'hot' // or 'cold' for production
    }
  }
};

export default agentConfig;

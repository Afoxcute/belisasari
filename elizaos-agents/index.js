// Iris ElizaOS Trading Agent - Main Entry Point
import { createIrisTradingAgent, IrisTradingFunctions } from './iris-trading-agent.js';
import SupabaseIntegration from './integrations/supabase-integration.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class IrisAgentOrchestrator {
  constructor() {
    this.agent = null;
    this.tradingFunctions = null;
    this.supabase = new SupabaseIntegration();
    this.isRunning = false;
  }

  // Initialize the complete Iris system
  async initialize() {
    try {
      console.log('🚀 Initializing Iris ElizaOS Trading Agent...\n');

      // Initialize the ElizaOS agent
      this.agent = await createIrisTradingAgent();
      this.tradingFunctions = new IrisTradingFunctions(this.agent);

      console.log('✅ Iris Trading Agent initialized');
      console.log('✅ Supabase integration ready');
      console.log('✅ All systems operational\n');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Iris system:', error);
      throw error;
    }
  }

  // Main analysis loop
  async runAnalysis() {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    try {
      console.log('🔍 Running Iris analysis cycle...\n');

      // 1. Memecoin data from Jupiter trending tokens
      let memecoins = [];
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const res = await fetch(`${frontendUrl}/api/jupiter/tokens/list?list=trending`);
        if (res.ok) {
          const list = await res.json();
          memecoins = (Array.isArray(list) ? list : []).map((t) => ({
            symbol: t.symbol ?? '?',
            name: t.name ?? 'Unknown',
            address: t.address
          }));
          console.log(`   Loaded ${memecoins.length} trending tokens from Jupiter`);
        }
      } catch (e) {
        console.warn('   Could not fetch Jupiter trending list:', e.message);
      }

      // 2. Analyze TikTok trends
      console.log('📱 Analyzing TikTok trends...');
      const tiktokTrends = await this.tradingFunctions.analyzeTikTokTrends();
      console.log(`   Analyzed ${tiktokTrends.trendingHashtags.length} hashtags`);

      // 3. Get recent TikTok data from Supabase
      console.log('🎬 Fetching recent TikTok data...');
      const tiktokData = await this.supabase.getRecentTikTokData(24);
      console.log(`   Retrieved ${tiktokData.length} TikTok videos`);

      // 4. Generate trading recommendations
      console.log('💡 Generating trading recommendations...');
      const recommendations = await this.tradingFunctions.generateTradingRecommendations();
      console.log(`   Generated ${recommendations.length} recommendations`);

      // 5. Store analysis results
      console.log('💾 Storing analysis results...');
      await this.supabase.storeAnalysisResult({
        type: 'comprehensive_analysis',
        data: {
          memecoins,
          tiktokTrends,
          tiktokData: tiktokData.slice(0, 5), // Store top 5
          recommendations
        },
        confidence: 0.85,
        recommendations: recommendations.map(r => r.reason)
      });

      // 6. Store trading recommendations
      for (const rec of recommendations) {
        await this.supabase.storeTradingRecommendation({
          tokenAddress: rec.token,
          action: rec.action,
          confidence: rec.confidence,
          reason: rec.reason,
          riskLevel: rec.riskLevel
        });
      }

      console.log('✅ Analysis cycle completed successfully\n');

      return {
        memecoins,
        tiktokTrends,
        recommendations,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error in analysis cycle:', error);
      throw error;
    }
  }

  // Start continuous monitoring
  async startMonitoring(intervalMs = 300000) { // 5 minutes default
    if (this.isRunning) {
      console.log('⚠️ Monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting continuous monitoring (${intervalMs / 1000}s intervals)...\n`);

    const runCycle = async () => {
      if (!this.isRunning) return;

      try {
        await this.runAnalysis();
      } catch (error) {
        console.error('❌ Error in monitoring cycle:', error);
      }

      // Schedule next cycle
      setTimeout(runCycle, intervalMs);
    };

    // Start the first cycle immediately
    runCycle();
  }

  // Stop monitoring
  stopMonitoring() {
    console.log('⏹️ Stopping monitoring...');
    this.isRunning = false;
  }

  // Get agent status
  getStatus() {
    return {
      initialized: !!this.agent,
      running: this.isRunning,
      timestamp: new Date().toISOString()
    };
  }

  // Handle user queries (for future chat interface)
  async handleQuery(query) {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    try {
      // This would use ElizaOS's natural language processing
      // For now, we'll provide a simple response
      const response = await this.agent.processMessage({
        content: query,
        userId: 'user',
        roomId: 'main'
      });

      return response;
    } catch (error) {
      console.error('Error handling query:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const iris = new IrisAgentOrchestrator();

  try {
    // Initialize the system
    await iris.initialize();

    // Run a single analysis cycle
    console.log('🔍 Running initial analysis...');
    const results = await iris.runAnalysis();

    // Display results
    console.log('📈 Analysis Results:');
    console.log(`   Trending Memecoins: ${results.memecoins.length}`);
    console.log(`   TikTok Hashtags: ${results.tiktokTrends.trendingHashtags.length}`);
    console.log(`   Recommendations: ${results.recommendations.length}`);
    console.log(`   Timestamp: ${results.timestamp}\n`);

    // Start continuous monitoring
    console.log('🔄 Starting continuous monitoring...');
    await iris.startMonitoring(300000); // 5 minutes

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n⏹️ Shutting down Iris agent...');
      iris.stopMonitoring();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { IrisAgentOrchestrator };

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

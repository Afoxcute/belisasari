'use client';

import { useState } from 'react';
import TrendingCoinsSummary from '@/components/dashboard/trending-coins-summary';
import TrendingCoinsAnalytics from '@/components/dashboard/trending-coins-analytics';
import { Rocket, Calendar, Download, Search, RefreshCw, BrainCircuit, Activity, LineChart, Diamond, Gem, Coins, Cpu } from 'lucide-react';

export default function TrendingCoinsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="bg-background-main min-h-screen text-text-main font-sans pb-24">
      <main className="max-w-[1440px] mx-auto p-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <Rocket className="text-[#00D4FF] w-8 h-8" />
            </div>
            <div>
              <h1 className="text-[26px] font-bold text-text-main leading-tight">Trending Coins Analytics</h1>
              <p className="text-[13px] text-text-secondary font-medium">Real-time terminal for high-momentum crypto assets and institutional flow.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-border-light rounded-lg text-sm font-medium hover:bg-foreground/10 transition-all">
              <Calendar className="w-4 h-4" />
              24h Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-black rounded-lg text-sm font-bold hover:brightness-110 transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Search & Quick Actions */}
        <div className="bg-card-bg border border-border-light rounded-xl p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-text-secondary">
              <Search className="w-5 h-5" />
            </span>
            <input 
              type="text" 
              placeholder="Search for coins, contracts, or categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-foreground/5 border-none rounded-lg py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-[#00D4FF]/50 text-text-main placeholder:text-text-secondary" 
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground/5 border border-border-light rounded-lg text-sm font-medium hover:bg-foreground/10 transition-all">
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {/* Market Overview Stats (Dynamically handled by components/dashboard/trending-coins-summary.tsx) */}
        <TrendingCoinsSummary />

        {/* Main Analytics Table Card (Dynamically handled by components/dashboard/trending-coins-analytics.tsx) */}
        <TrendingCoinsAnalytics />

        {/* Panels Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Correlation Insights */}
          <div className="bg-card-bg border border-border-light rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BrainCircuit className="text-[#00D4FF] w-6 h-6" />
                <h3 className="font-bold text-lg text-text-main">Correlation Insights</h3>
              </div>
              <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Live Engine</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg border-l-2 border-[#00D4FF]">
                <div>
                  <p className="text-sm font-bold text-text-main">BTC / ETH Correlation</p>
                  <p className="text-xs text-text-secondary">High positive linkage detected</p>
                </div>
                <span className="px-3 py-1 bg-[#00D4FF] text-black text-[10px] font-black rounded-full uppercase">Strong</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg border-l-2 border-amber-500/50">
                <div>
                  <p className="text-sm font-bold text-text-main">Layer 1 Ecosystem Flow</p>
                  <p className="text-xs text-text-secondary">Cyclical rotation in progress</p>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-black rounded-full uppercase border border-amber-500/30">Moderate</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg border-l-2 border-slate-700">
                <div>
                  <p className="text-sm font-bold text-text-main">Stablecoin Dominance</p>
                  <p className="text-xs text-text-secondary">Neutral market participants</p>
                </div>
                <span className="px-3 py-1 bg-foreground/5 text-text-secondary text-[10px] font-black rounded-full uppercase border border-border-light">Weak</span>
              </div>
            </div>
          </div>

          {/* Trading Signals */}
          <div className="bg-card-bg border border-border-light rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="text-[#00D4FF] w-6 h-6" />
                <h3 className="font-bold text-lg text-text-main">Trading Signals</h3>
              </div>
              <button className="text-xs text-[#00D4FF] font-bold hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUpIcon className="text-emerald-400 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">Strong Buy (SOL)</p>
                    <p className="text-xs text-emerald-400/70">Oversold on 4H RSI</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-text-secondary">14:20:05</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center">
                    <EyeIcon className="text-amber-400 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">Watch (NEAR)</p>
                    <p className="text-xs text-amber-400/70">Consolidation at resistance</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-text-secondary">14:15:32</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#00D4FF]/10 rounded-lg border border-[#00D4FF]/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#00D4FF]/20 flex items-center justify-center">
                    <LandmarkIcon className="text-[#00D4FF] w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">Institutional Flow</p>
                    <p className="text-xs text-[#00D4FF]/70">Large wallet accumulation (BTC)</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-text-secondary">13:58:12</span>
              </div>
            </div>
          </div>

        </div>

        {/* Market Trends Panel */}
        <div className="bg-card-bg border border-border-light rounded-xl p-6">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-text-main">
            <LineChart className="text-[#00D4FF] w-6 h-6" />
            Market Opportunity Scanner
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Momentum Coins */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase font-bold text-text-secondary tracking-widest">Momentum Coins</p>
              <div className="grid grid-cols-1 gap-3">
                
                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-border-light rounded-xl hover:border-[#00D4FF]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-border-light">
                      <Diamond className="text-text-secondary w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-text-main">Arbitrum (ARB)</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">High Growth</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">+14.2%</p>
                    <p className="text-[10px] text-text-secondary">24h Vol: $450M</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-border-light rounded-xl hover:border-[#00D4FF]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-border-light">
                      <Coins className="text-text-secondary w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-text-main">Injective (INJ)</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">Breakout</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">+9.8%</p>
                    <p className="text-[10px] text-text-secondary">24h Vol: $120M</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Hidden Gems */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase font-bold text-text-secondary tracking-widest">Hidden Gems</p>
              <div className="grid grid-cols-1 gap-3">
                
                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-border-light rounded-xl hover:border-[#00D4FF]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-border-light">
                      <Cpu className="text-text-secondary w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-text-main">Celestia (TIA)</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] text-[10px] font-bold rounded">Unrealized Potential</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-text-main font-bold">$12.45</p>
                    <p className="text-[10px] text-text-secondary">Cap: $1.2B</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-border-light rounded-xl hover:border-[#00D4FF]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-border-light">
                      <Gem className="text-text-secondary w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-text-main">Render (RNDR)</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] text-[10px] font-bold rounded">Undervalued AI</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-text-main font-bold">$11.20</p>
                    <p className="text-[10px] text-text-secondary">Cap: $4.1B</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer Stats Overlay */}
      <footer className="border-t border-border-light bg-card-bg/80 backdrop-blur-md fixed bottom-0 left-0 right-0 px-6 py-2 z-50">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-text-secondary">
          <div className="hidden md:flex flex-row items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Terminal Connected
            </div>
            <div>BTC: <span className="text-text-main">$64,321.40</span> <span className="text-emerald-400 ml-1">+2.4%</span></div>
            <div>ETH: <span className="text-text-main">$3,450.12</span> <span className="text-rose-400 ml-1">-1.1%</span></div>
            <div>SOL: <span className="text-text-main">$145.82</span> <span className="text-emerald-400 ml-1">+8.1%</span></div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span>Latency: 24ms</span>
            <span>API Status: Stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons needed internally avoiding full import lists across imports above
function TrendingUpIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
}
function EyeIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>;
}
function LandmarkIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>;
}


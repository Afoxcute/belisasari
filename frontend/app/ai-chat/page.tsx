'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AIChatInterface } from '@/components/ai-chat/ai-chat-interface';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  TrendingUp, 
  Bell, 
  Settings, 
  BarChart3,
  Users,
  Zap,
  Loader2
} from 'lucide-react';
import { aiAgentService, ChatMessage } from '@/lib/services/ai-agent-service';
import { personalizationService, PersonalizedRecommendation } from '@/lib/services/personalization-service';
import { realtimeService, RealtimeUpdate } from '@/lib/services/realtime-service';

export default function AIChatPage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🚀 Initializing AI Chat Page...');
        
        await aiAgentService.initialize();
        await personalizationService.initializeUser('user_123');
        realtimeService.subscribe('ai-chat', handleRealtimeUpdate);
        
        const userProfile = personalizationService.getUserProfile();
        setUserPreferences(userProfile?.preferences || null);
        
        const recs = personalizationService.getRecommendations();
        setRecommendations(recs);
        
        setIsInitialized(true);
        setIsLoading(false);
        
        console.log('✅ AI Chat Page initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing AI Chat Page:', error);
        setIsLoading(false);
      }
    };

    initializeServices();

    return () => {
      realtimeService.unsubscribe('ai-chat');
    };
  }, []);

  const handleRealtimeUpdate = useCallback((update: RealtimeUpdate) => {
    setRealtimeUpdates(prev => [update, ...prev.slice(0, 9)]);
    
    if (update.priority === 'urgent' || update.priority === 'high') {
      showNotification(update);
    }
  }, []);

  const showNotification = (update: RealtimeUpdate) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Belisasari Alert: ${update.type}`, {
        body: `New ${update.type} update available`,
        icon: '/belisasari.png'
      });
    }
  };

  const handleChatMessage = async (message: ChatMessage) => {
    try {
      const response = await aiAgentService.sendMessage(message.content);
      
      if (message.type === 'user') {
        console.log('📝 Updating user preferences based on message:', message.content);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error handling chat message:', error);
      return {
        id: Date.now().toString(),
        type: 'system' as const,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
    }
  };

  const handleVoiceCommand = (command: string) => {
    console.log('🎤 Voice command received:', command);
    aiAgentService.sendMessage(command);
  };

  const markRecommendationAsRead = (id: string) => {
    personalizationService.markRecommendationAsRead(id);
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  };

  const updatePreferences = async (newPreferences: any) => {
    await personalizationService.updatePreferences(newPreferences);
    setUserPreferences(newPreferences);
    
    const recs = personalizationService.getRecommendations();
    setRecommendations(recs);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-main flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Initializing Elfa AI Agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background-main text-text-main">
      <div className="container max-w-[1400px] mx-auto py-6 px-4">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#00D4FF]/40 p-0.5 shadow-lg shadow-[#00D4FF]/20">
            <div className="w-full h-full bg-card-bg rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#00D4FF]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
              Elfa AI Agent
              <Badge className="bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 hover:bg-[#00D4FF]/20 ml-2">Beta</Badge>
            </h1>
            <p className="text-[14px] text-[#6B7280]">Your intelligent companion for the Stitch network.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-full bg-card-bg border-border-light rounded-2xl overflow-hidden shadow-2xl">
              <AIChatInterface
                onMessage={handleChatMessage}
                onVoiceCommand={handleVoiceCommand}
                personalization={userPreferences}
                className="h-full border-0 bg-transparent rounded-none"
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* System Status */}
            <Card className="p-5 bg-card-bg border-border-light rounded-2xl shadow-xl">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-5 w-5 text-[#00D4FF]" />
                <h3 className="font-bold text-text-main tracking-tight">System Status</h3>
              </div>
              <div className="space-y-3 text-[13px] font-medium">
                <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-lg border border-border-light">
                  <span className="text-[#6B7280]">Agent Core</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isInitialized ? "bg-[#00FF88] animate-pulse" : "bg-red-500"}`}></span>
                    <span className="text-text-main">{isInitialized ? "Online" : "Offline"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-lg border border-border-light">
                  <span className="text-[#6B7280]">Data Stream</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${realtimeService.isWebSocketConnected() ? "bg-[#00FF88]" : "bg-yellow-500"}`}></span>
                    <span className="text-text-main">{realtimeService.isWebSocketConnected() ? "Live" : "Simulated"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-lg border border-border-light">
                  <span className="text-[#6B7280]">Processed Events</span>
                  <span className="text-[#00D4FF] font-bold">{realtimeUpdates.length}</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-5 bg-card-bg border-border-light rounded-2xl shadow-xl">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-[#A855F7]" />
                <h3 className="font-bold text-text-main tracking-tight">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-20 flex-col gap-2 bg-white/[0.02] border-border-light hover:bg-white/[0.05] hover:border-border-light text-[#6B7280] hover:text-text-main rounded-xl"
                  onClick={() => aiAgentService.sendMessage('Show me trending memecoins')}
                >
                  <TrendingUp className="h-5 w-5 text-[#00FF88]" />
                  <span className="text-[11px] font-medium whitespace-normal leading-tight text-center">Trending Tokens</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-20 flex-col gap-2 bg-white/[0.02] border-border-light hover:bg-white/[0.05] hover:border-border-light text-[#6B7280] hover:text-text-main rounded-xl"
                  onClick={() => aiAgentService.sendMessage('Analyze the current market')}
                >
                  <BarChart3 className="h-5 w-5 text-[#00D4FF]" />
                  <span className="text-[11px] font-medium whitespace-normal leading-tight text-center">Market Analysis</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-20 flex-col gap-2 bg-white/[0.02] border-border-light hover:bg-white/[0.05] hover:border-border-light text-[#6B7280] hover:text-text-main rounded-xl"
                  onClick={() => aiAgentService.sendMessage('Show my portfolio')}
                >
                  <Users className="h-5 w-5 text-[#A855F7]" />
                  <span className="text-[11px] font-medium whitespace-normal leading-tight text-center">My Portfolio</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-20 flex-col gap-2 bg-white/[0.02] border-border-light hover:bg-white/[0.05] hover:border-border-light text-[#6B7280] hover:text-text-main rounded-xl"
                  onClick={() => aiAgentService.sendMessage('Help me learn about trading')}
                >
                  <Bell className="h-5 w-5 text-amber-500" />
                  <span className="text-[11px] font-medium whitespace-normal leading-tight text-center">Trading Guide</span>
                </Button>
              </div>
            </Card>

            {/* Personalized Recommendations */}
            <Card className="p-5 bg-card-bg border-border-light rounded-2xl shadow-xl flex-1">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-[#00FF88]" />
                <h3 className="font-bold text-text-main tracking-tight">Insights</h3>
              </div>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-white/[0.02] border border-border-light rounded-xl cursor-pointer hover:bg-white/[0.05] hover:border-border-light transition-colors group"
                    onClick={() => markRecommendationAsRead(rec.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-text-main group-hover:text-[#00D4FF] transition-colors">{rec.title}</p>
                        <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">
                          {rec.content}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                        rec.priority === 'high' ? 'bg-red-500' : 
                        rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-[#00D4FF]'
                      }`} />
                    </div>
                  </div>
                ))}
                {recommendations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border-light rounded-xl bg-white/[0.01]">
                    <TrendingUp className="h-6 w-6 text-[#6B7280]/40 mb-2" />
                    <p className="text-[12px] text-[#6B7280] font-medium">No new insights right now.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Real-time Updates */}
            {realtimeUpdates.length > 0 && (
              <Card className="p-5 bg-card-bg border-border-light rounded-2xl shadow-xl">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-text-main tracking-tight">Live Network Feeds</h3>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {realtimeUpdates.slice(0, 4).map((update) => (
                    <div key={update.id} className="p-3 bg-white/[0.02] border border-border-light rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge 
                          variant="outline"
                          className={`text-[9px] uppercase tracking-wider font-bold border-0 px-2 py-0.5 ${
                            update.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 
                            update.priority === 'high' ? 'bg-[#00D4FF]/10 text-[#00D4FF]' : 
                            'bg-foreground/5 text-[#6B7280]'
                          }`}
                        >
                          {update.type}
                        </Badge>
                        <span className="text-[10px] text-[#6B7280] font-medium">
                          {update.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-[12px] text-text-main/90 leading-tight">
                        {update.data?.message || update.data?.content || 'Network update received'}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

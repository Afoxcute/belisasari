'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { realtimeService } from '@/lib/services/realtime-service';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { personalizationService } from '@/lib/services/personalization-service';

export default function AIChatTestPage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🧪 Testing AI Chat Services...');
        
        // Initialize AI agent service
        await aiAgentService.initialize();
        console.log('✅ AI Agent Service initialized');
        
        // Initialize personalization service
        await personalizationService.initializeUser('test_user');
        console.log('✅ Personalization Service initialized');
        
        // Check realtime service status
        const status = realtimeService.getStatus();
        setRealtimeStatus(status);
        console.log('✅ Realtime Service status:', status);
        
        // Subscribe to realtime updates
        realtimeService.subscribe('test-page', (update) => {
          console.log('📡 Received realtime update:', update);
          setMessages(prev => [...prev, `Realtime: ${update.type} - ${JSON.stringify(update.data).substring(0, 50)}...`]);
        });
        
        setIsInitialized(true);
        setMessages(prev => [...prev, '✅ All services initialized successfully!']);
        
      } catch (error) {
        console.error('❌ Error initializing services:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setMessages(prev => [...prev, `❌ Error: ${errorMessage}`]);
      }
    };

    initializeServices();
  }, []);

  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    try {
      setMessages(prev => [...prev, `User: ${testMessage}`]);
      
      // Send message to AI agent
      const response = await aiAgentService.sendMessage(testMessage);
      setMessages(prev => [...prev, `AI: ${response}`]);
      
      setTestMessage('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, `❌ Error: ${errorMessage}`]);
    }
  };

  const testRealtimeService = () => {
    const status = realtimeService.getStatus();
    setRealtimeStatus(status);
    setMessages(prev => [...prev, `📊 Realtime Status: ${JSON.stringify(status)}`]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Chat Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Service Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={isInitialized ? "default" : "destructive"}>
                {isInitialized ? "Initialized" : "Not Initialized"}
              </Badge>
              <span>AI Chat Services</span>
            </div>
            
            {realtimeStatus && (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Realtime Service:</strong>
                </div>
                <div className="text-xs bg-gray-100 p-2 rounded">
                  <pre>{JSON.stringify(realtimeStatus, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 space-x-2">
            <Button onClick={testRealtimeService} variant="outline">
              Test Realtime
            </Button>
            <Button onClick={clearMessages} variant="outline">
              Clear Messages
            </Button>
          </div>
        </Card>

        {/* Chat Interface */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Chat</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Type a test message..."
                className="flex-1 px-3 py-2 border rounded-md"
                onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
              />
              <Button onClick={sendTestMessage} disabled={!isInitialized}>
                Send
              </Button>
            </div>
            
            <div className="h-64 overflow-y-auto border rounded-md p-3 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-text-secondary text-sm">No messages yet...</p>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className="mb-2 text-sm">
                    {message}
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Debug Information */}
      <Card className="p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        
        <div className="space-y-2 text-sm">
          <div>
            <strong>Environment:</strong> {typeof window !== 'undefined' ? 'Browser' : 'Server'}
          </div>
          <div>
            <strong>WebSocket URL:</strong> {process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'}
          </div>
          <div>
            <strong>Current Time:</strong> {new Date().toISOString()}
          </div>
        </div>
      </Card>
    </div>
  );
}

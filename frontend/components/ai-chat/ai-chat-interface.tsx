'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  AlertCircle, 
  BarChart3,
  Loader2,
  Volume2,
  VolumeX,
  TrendingUp
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  isTyping?: boolean;
}

interface AIChatInterfaceProps {
  onMessage?: (message: Message) => void;
  onVoiceCommand?: (command: string) => void;
  personalization?: any;
  className?: string;
}

export function AIChatInterface({ 
  onMessage, 
  onVoiceCommand, 
  personalization,
  className = '' 
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m Elfa, your AI memecoin hunting assistant on the Stitch network. I can help you find trending tokens, analyze market data, and provide trading insights. What would you like to know?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    onMessage?.(userMessage);

    try {
      const response = await simulateAIResponse(inputValue);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        data: response.data,
      };

      setMessages(prev => [...prev, aiMessage]);
      onMessage?.(aiMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        onVoiceCommand?.(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const simulateAIResponse = async (input: string): Promise<{ content: string; data?: any }> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('trending') || lowerInput.includes('trend')) {
      return {
        content: 'Here are the current trending memecoins based on network data:',
        data: {
          type: 'trending',
          tokens: [
            { symbol: 'BONK', price: 0.000012, change: 15.67, volume: '1.2M' },
            { symbol: 'WIF', price: 2.45, change: 8.23, volume: '850K' },
            { symbol: 'PEPE', price: 0.000001, change: -3.45, volume: '650K' }
          ]
        }
      };
    }

    if (lowerInput.includes('analysis') || lowerInput.includes('analyze')) {
      return {
        content: 'Based on current market data and social sentiment, here\'s my analysis:',
        data: {
          type: 'analysis',
          summary: 'Strong bullish momentum detected across multiple tokens with high social engagement scores.',
          recommendation: 'Consider scaled entries in trending tokens with strict invalidation levels.',
          confidence: 0.75
        }
      };
    }

    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
      return {
        content: 'I can help you with:\n\n• Finding trending tokens from the network\n• Analyzing market data and sentiment\n• Providing trading recommendations\n• Explaining trading strategies\n• Tracking your portfolio performance\n\nJust ask me anything about crypto trading!',
        data: { type: 'help' }
      };
    }

    return {
      content: 'I understand you\'re asking about tokens. Could you be more specific about what you\'d like to know? I can help with trending analysis, market insights, or trading recommendations.',
      data: { type: 'general' }
    };
  };

  const renderMessageContent = (message: Message) => {
    if (message.data?.type === 'trending') {
      return (
        <div className="space-y-4">
          <p className="text-text-main/90 leading-relaxed font-medium">{message.content}</p>
          <div className="space-y-2">
            {message.data.tokens.map((token: any, index: number) => (
              <div key={index} className="p-3 bg-foreground/5 border border-border-light rounded-xl hover:border-border-light transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A1A24] flex items-center justify-center text-[10px] font-bold text-text-main border border-border-light">
                      {token.symbol.slice(0,2)}
                    </div>
                    <div>
                      <span className="font-bold text-text-main text-[14px] tracking-tight">{token.symbol}</span>
                      <div className="text-[12px] font-medium text-text-main/90">${token.price.toFixed(6)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[13px] font-bold ${token.change > 0 ? 'text-[#00FF88]' : 'text-red-500'}`}>
                      {token.change > 0 ? '+' : ''}{token.change}%
                    </div>
                    <div className="text-[11px] font-medium text-[#6B7280]">Vol: {token.volume}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (message.data?.type === 'analysis') {
      return (
        <div className="space-y-4">
          <p className="text-text-main/90 leading-relaxed font-medium">{message.content}</p>
          <div className="p-4 bg-foreground/5 border border-border-light rounded-xl space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-border-light">
              <BarChart3 className="h-4 w-4 text-[#A855F7]" />
              <span className="font-bold text-[13px] text-text-main tracking-wide uppercase">Analysis Summary</span>
            </div>
            <p className="text-[13px] text-text-main/80 leading-relaxed">{message.data.summary}</p>
            <div className="flex items-start justify-between gap-4 pt-2">
              <span className="text-[12px] text-[#6B7280] font-medium shrink-0">Recommendation:</span>
              <span className="text-[12px] font-bold text-[#00D4FF] text-right">{message.data.recommendation}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-[#6B7280] font-medium shrink-0">Confidence:</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FF88]" 
                    style={{ width: `${message.data.confidence * 100}%` }}
                  />
                </div>
                <span className="text-[12px] font-bold text-text-main">{Math.round(message.data.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <p className="whitespace-pre-wrap text-text-main/90 leading-relaxed font-medium">{message.content}</p>;
  };

  return (
    <div className={`flex flex-col h-full bg-transparent ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-light bg-white/[0.02]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-[#00D4FF]" />
          </div>
          <h2 className="text-[15px] font-bold text-text-main tracking-tight">Elfa Assistant</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#6B7280] hover:text-text-main hover:bg-foreground/5 rounded-lg"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-transparent">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex w-full ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-end space-x-3 max-w-[85%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    message.type === 'user'
                      ? 'bg-white text-[#111118]'
                      : message.type === 'ai'
                      ? 'bg-card-bg border border-[#00D4FF]/30 text-[#00D4FF]'
                      : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : message.type === 'ai' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                
                <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                   {message.type === 'ai' && (
                     <span className="text-[11px] font-medium text-[#6B7280] mb-1 ml-1">Elfa</span>
                   )}
                  <div
                    className={`rounded-2xl px-5 py-3 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-[#00D4FF] text-[#111118] rounded-br-sm'
                        : message.type === 'ai'
                        ? 'bg-[#1A1A24] text-text-main border border-border-light rounded-bl-sm'
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}
                  >
                    {renderMessageContent(message)}
                  </div>
                  <div className={`text-[10px] font-medium text-[#6B7280] mt-1.5 ${message.type === 'user' ? 'mr-1' : 'ml-1'}`}>
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card-bg border border-[#00D4FF]/30 text-[#00D4FF] flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start">
                   <span className="text-[11px] font-medium text-[#6B7280] mb-1 ml-1">Elfa</span>
                  <div className="rounded-2xl px-5 py-3.5 bg-[#1A1A24] border border-border-light rounded-bl-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-white/[0.02]">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Elfa about tokens, trends, or analysis..."
            disabled={isLoading}
            className="w-full h-14 bg-card-bg border-border-light rounded-xl pl-4 pr-24 text-[15px] text-text-main focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] placeholder:text-[#6B7280]"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`h-11 w-11 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500' : 'text-[#6B7280] hover:text-text-main hover:bg-foreground/5'}`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="h-11 w-11 rounded-lg bg-[#00D4FF] text-[#111118] hover:bg-[#00D4FF]/80 disabled:bg-[#00D4FF]/20 disabled:text-[#00D4FF]/50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="mt-3 text-center text-[11px] font-medium text-[#6B7280]">
          Elfa can make mistakes. Verify important trading data.
        </div>
      </div>
    </div>
  );
}

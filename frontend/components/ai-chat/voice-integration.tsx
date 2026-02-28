'use client';

import React, { useState, useEffect, useRef } from 'react';

// Web Speech API type definitions
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Pause, 
  Settings,
  XCircle,
  Loader2
} from 'lucide-react';

interface VoiceIntegrationProps {
  onVoiceCommand?: (command: string) => void;
  onVoiceResponse?: (response: string) => void;
  isEnabled?: boolean;
  className?: string;
}

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  lastCommand: string | null;
  lastResponse: string | null;
  isSupported: boolean;
  error: string | null;
}

export function VoiceIntegration({ 
  onVoiceCommand, 
  onVoiceResponse,
  isEnabled = true,
  className = '' 
}: VoiceIntegrationProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    lastCommand: null,
    lastResponse: null,
    isSupported: false,
    error: null
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check for browser support
  useEffect(() => {
    const checkSupport = () => {
      const speechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const speechSynthesis = 'speechSynthesis' in window;
      
      setVoiceState(prev => ({
        ...prev,
        isSupported: speechRecognition && speechSynthesis,
        error: !speechRecognition || !speechSynthesis ? 'Voice features not supported in this browser' : null
      }));
    };

    checkSupport();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!voiceState.isSupported) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setVoiceState(prev => ({ ...prev, isListening: true, error: null }));
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          setVoiceState(prev => ({ 
            ...prev, 
            lastCommand: transcript,
            isListening: false,
            isProcessing: true
          }));
          
          onVoiceCommand?.(transcript);
          
          // Simulate processing time
          setTimeout(() => {
            setVoiceState(prev => ({ ...prev, isProcessing: false }));
          }, 1000);
        }
      };

      recognitionRef.current.onend = () => {
        setVoiceState(prev => ({ ...prev, isListening: false }));
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setVoiceState(prev => ({ 
          ...prev, 
          isListening: false, 
          error: `Recognition error: ${event.error}` 
        }));
      };
    }
  }, [voiceState.isSupported, onVoiceCommand]);

  // Initialize speech synthesis
  useEffect(() => {
    if (!voiceState.isSupported) return;

    // Set up audio context for better audio control
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }, [voiceState.isSupported]);

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current || voiceState.isListening) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Failed to start voice recognition' 
      }));
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current && voiceState.isListening) {
      recognitionRef.current.stop();
    }
  };

  // Speak text
  const speak = (text: string) => {
    if (!voiceState.isSupported || voiceState.isSpeaking) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: true, lastResponse: text }));
    };

    utterance.onend = () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
      onVoiceResponse?.(text);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setVoiceState(prev => ({ 
        ...prev, 
        isSpeaking: false, 
        error: `Speech error: ${event.error}` 
      }));
    };

    synthesisRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setVoiceState(prev => ({ ...prev, isSpeaking: false }));
  };

  // Clear error
  const clearError = () => {
    setVoiceState(prev => ({ ...prev, error: null }));
  };

  // Get available voices
  const getVoices = () => {
    return speechSynthesis.getVoices();
  };

  // Test voice functionality
  const testVoice = () => {
    speak("Voice integration is working correctly. You can now use voice commands to interact with Belisasari.");
  };

  if (!isEnabled) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-text-secondary">
          <MicOff className="h-8 w-8 mx-auto mb-2" />
          <p>Voice integration is disabled</p>
        </div>
      </Card>
    );
  }

  if (!voiceState.isSupported) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-text-secondary">
          <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="font-medium">Voice Not Supported</p>
          <p className="text-sm mt-1">Your browser doesn't support voice features</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Voice Integration</h3>
          </div>
          <Badge variant={voiceState.isListening ? "destructive" : "default"}>
            {voiceState.isListening ? "Listening" : "Ready"}
          </Badge>
        </div>

        {/* Error Display */}
        {voiceState.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-300">{voiceState.error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={voiceState.isListening ? "destructive" : "default"}
            size="lg"
            onClick={voiceState.isListening ? stopListening : startListening}
            disabled={voiceState.isProcessing || voiceState.isSpeaking}
            className="w-16 h-16 rounded-full"
          >
            {voiceState.isListening ? (
              <MicOff className="h-6 w-6" />
            ) : voiceState.isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant={voiceState.isSpeaking ? "destructive" : "outline"}
            size="lg"
            onClick={voiceState.isSpeaking ? stopSpeaking : () => testVoice()}
            disabled={voiceState.isListening || voiceState.isProcessing}
            className="w-16 h-16 rounded-full"
          >
            {voiceState.isSpeaking ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Volume2 className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Mic className="h-4 w-4 text-text-secondary" />
              <span className="text-sm font-medium">Last Command</span>
            </div>
            <p className="text-xs text-text-secondary truncate">
              {voiceState.lastCommand || "None"}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Volume2 className="h-4 w-4 text-text-secondary" />
              <span className="text-sm font-medium">Last Response</span>
            </div>
            <p className="text-xs text-text-secondary truncate">
              {voiceState.lastResponse ? "Spoken" : "None"}
            </p>
          </div>
        </div>

        {/* Quick Commands */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">Quick Commands</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak("Show me trending memecoins")}
              disabled={voiceState.isSpeaking || voiceState.isListening}
            >
              Trending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak("Analyze the market")}
              disabled={voiceState.isSpeaking || voiceState.isListening}
            >
              Analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak("Show my portfolio")}
              disabled={voiceState.isSpeaking || voiceState.isListening}
            >
              Portfolio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak("Help me learn")}
              disabled={voiceState.isSpeaking || voiceState.isListening}
            >
              Learn
            </Button>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Voice Settings</span>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            <p>• Click microphone to start listening</p>
            <p>• Say "trending", "analysis", or "portfolio"</p>
            <p>• Voice responses are automatically spoken</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatternRecognitionService, PatternDetection, PatternInsight, PatternSummary } from '@/lib/services/pattern-recognition-service';
import { BackendIntegrationService } from '@/lib/services/backend-integration-service';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  BarChart3, 
  Play, 
  RefreshCw,
  Eye,
  Lightbulb,
  Zap
} from 'lucide-react';

interface PatternRecognitionCardProps {
  className?: string;
}

export function PatternRecognitionCard({ className }: PatternRecognitionCardProps) {
  const [patternSummary, setPatternSummary] = useState<PatternSummary[]>([]);
  const [patternDetections, setPatternDetections] = useState<PatternDetection[]>([]);
  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  // Load pattern data
  const loadPatternData = async () => {
    setIsLoading(true);
    try {
      const [summary, detections, insights] = await Promise.all([
        PatternRecognitionService.getPatternSummary(),
        PatternRecognitionService.getPatternDetections({ limit: 10 }),
        PatternRecognitionService.getPatternInsights({ limit: 10 })
      ]);

      setPatternSummary(summary);
      setPatternDetections(detections);
      setPatternInsights(insights);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load pattern data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start pattern recognition
  const startPatternRecognition = async () => {
    setIsRunning(true);
    try {
      const response = await BackendIntegrationService.startPatternRecognition();
      if (response.success) {
        // Reload data after successful pattern recognition
        await loadPatternData();
      }
    } catch (error) {
      console.error('Failed to start pattern recognition:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadPatternData();
  }, []);

  const getPatternTypeIcon = (patternType: string) => {
    switch (patternType) {
      case 'volume_spike':
      case 'volume_trend':
        return <BarChart3 className="h-4 w-4" />;
      case 'sentiment_spike':
      case 'sentiment_trend':
        return <Brain className="h-4 w-4" />;
      case 'price_breakout':
      case 'price_reversal':
        return <TrendingUp className="h-4 w-4" />;
      case 'social_viral':
      case 'engagement_spike':
        return <Zap className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getPatternTypeColor = (patternType: string) => {
    switch (patternType) {
      case 'volume_spike':
      case 'volume_trend':
        return 'bg-blue-100 text-blue-800';
      case 'sentiment_spike':
      case 'sentiment_trend':
        return 'bg-green-100 text-green-800';
      case 'price_breakout':
      case 'price_reversal':
        return 'bg-purple-100 text-purple-800';
      case 'social_viral':
      case 'engagement_spike':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightTypeIcon = (insightType: string) => {
    switch (insightType) {
      case 'opportunity':
        return <Target className="h-4 w-4" style={{ color: 'var(--dash-green)' }} />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" style={{ color: '#EAB308' }} />;
      case 'trend':
        return <TrendingUp className="h-4 w-4" style={{ color: 'var(--dash-cyan)' }} />;
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4" style={{ color: 'var(--dash-red)' }} />;
      default:
        return <Lightbulb className="h-4 w-4" style={{ color: 'var(--dash-muted)' }} />;
    }
  };

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'detections', label: 'Detections' },
    { key: 'insights', label: 'Insights' },
  ];

  return (
    <div className={`dash-card ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--dash-white)' }}>
          Pattern Recognition
        </span>
        <div className="flex items-center gap-2">
          <button
            className="dash-play-btn"
            onClick={loadPatternData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            className="dash-btn-cyan"
            onClick={startPatternRecognition}
            disabled={isRunning}
          >
            <Play className="h-3.5 w-3.5" />
            {isRunning ? 'Running...' : 'Start Analysis'}
          </button>
        </div>
      </div>
      {lastUpdate && (
        <p style={{ fontSize: 11, color: 'var(--dash-muted)', marginBottom: 12 }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {/* Tab bar */}
      <div className="flex gap-0 border-b" style={{ borderColor: 'var(--dash-border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`dash-tab ${activeTab === tab.key ? 'dash-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'summary' && (
          <div className="space-y-3">
            {patternSummary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patternSummary.map((summary) => (
                  <div key={summary.pattern_type} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--dash-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2" style={{ color: 'var(--dash-white)' }}>
                        {getPatternTypeIcon(summary.pattern_type)}
                        <span style={{ fontSize: 13, fontWeight: 500 }} className="capitalize">
                          {summary.pattern_type.replace('_', ' ')}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--dash-cyan)', background: 'rgba(0,212,255,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                        {summary.detection_count} detected
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between" style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--dash-muted)' }}>Avg Strength</span>
                        <span style={{ color: 'var(--dash-white)' }}>{(summary.avg_strength * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'var(--dash-cyan)', width: `${summary.avg_strength * 100}%` }} />
                      </div>
                      <div className="flex justify-between" style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--dash-muted)' }}>Avg Confidence</span>
                        <span style={{ color: 'var(--dash-white)' }}>{(summary.avg_confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'var(--dash-green)', width: `${summary.avg_confidence * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--dash-muted)', opacity: 0.5 }} />
                <p style={{ color: 'var(--dash-muted)', fontSize: 13 }}>No pattern data available</p>
                <p style={{ color: 'var(--dash-muted)', fontSize: 12, opacity: 0.7 }}>Run pattern recognition to detect patterns</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'detections' && (
          <div className="space-y-3">
            {patternDetections.length > 0 ? (
              patternDetections.map((detection) => (
                <div key={detection.id} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--dash-border)' }}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2" style={{ color: 'var(--dash-white)' }}>
                      {getPatternTypeIcon(detection.pattern_type)}
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{detection.token_symbol}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.1)', color: 'var(--dash-purple)' }}>
                        {detection.pattern_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 11, color: 'var(--dash-muted)', border: '1px solid var(--dash-border)', padding: '2px 6px', borderRadius: 4 }}>
                        Str: {(detection.pattern_strength * 100).toFixed(1)}%
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--dash-muted)', border: '1px solid var(--dash-border)', padding: '2px 6px', borderRadius: 4 }}>
                        Conf: {(detection.pattern_confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--dash-muted)' }}>
                    <span>Detected: {new Date(detection.detected_at).toLocaleString()}</span>
                    <span style={{ color: detection.is_active ? 'var(--dash-green)' : 'var(--dash-muted)' }}>
                      {detection.is_active ? 'Active' : 'Expired'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Eye className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--dash-muted)', opacity: 0.5 }} />
                <p style={{ color: 'var(--dash-muted)', fontSize: 13 }}>No pattern detections available</p>
                <p style={{ color: 'var(--dash-muted)', fontSize: 12, opacity: 0.7 }}>Run pattern recognition to detect patterns</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-3">
            {patternInsights.length > 0 ? (
              patternInsights.map((insight) => (
                <div key={insight.id} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--dash-border)' }}>
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-start gap-2">
                      {getInsightTypeIcon(insight.insight_type)}
                      <div>
                        <h4 style={{ fontWeight: 500, fontSize: 13, color: 'var(--dash-white)' }}>{insight.insight_title}</h4>
                        <p style={{ fontSize: 12, color: 'var(--dash-muted)', marginTop: 2 }}>
                          {insight.insight_description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 11, color: 'var(--dash-muted)', border: '1px solid var(--dash-border)', padding: '2px 6px', borderRadius: 4 }}>
                        Conf: {(insight.confidence_score * 100).toFixed(1)}%
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--dash-muted)', border: '1px solid var(--dash-border)', padding: '2px 6px', borderRadius: 4 }}>
                        Impact: {(insight.impact_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {insight.recommendation && (
                    <div className="mt-2 p-2 rounded" style={{ background: 'rgba(0,212,255,0.06)', fontSize: 12 }}>
                      <strong style={{ color: 'var(--dash-cyan)' }}>Recommendation:</strong>{' '}
                      <span style={{ color: 'var(--dash-white)' }}>{insight.recommendation}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-2" style={{ fontSize: 11, color: 'var(--dash-muted)' }}>
                    <span>Token: {insight.token_symbol}</span>
                    <span>Created: {new Date(insight.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--dash-muted)', opacity: 0.5 }} />
                <p style={{ color: 'var(--dash-muted)', fontSize: 13 }}>No pattern insights available</p>
                <p style={{ color: 'var(--dash-muted)', fontSize: 12, opacity: 0.7 }}>Run pattern recognition to generate insights</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

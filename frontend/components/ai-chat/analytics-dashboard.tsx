'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';

interface AnalyticsData {
  performance: {
    totalSessions: number;
    averageSessionTime: number;
    totalMessages: number;
    aiRecommendations: number;
    successfulTrades: number;
    totalProfit: number;
    winRate: number;
  };
  learning: {
    completedTopics: string[];
    currentLevel: string;
    improvementAreas: string[];
    knowledgeScore: number;
  };
  engagement: {
    dailyActiveMinutes: number;
    weeklyActiveDays: number;
    favoriteFeatures: string[];
    responseAccuracy: number;
  };
  recommendations: {
    totalGenerated: number;
    accepted: number;
    rejected: number;
    pending: number;
    successRate: number;
  };
}

interface AnalyticsDashboardProps {
  userId?: string;
  className?: string;
}

export function AnalyticsDashboard({ userId = 'user_123', className = '' }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [userId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Simulate loading analytics data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAnalytics: AnalyticsData = {
        performance: {
          totalSessions: 45,
          averageSessionTime: 12.5,
          totalMessages: 234,
          aiRecommendations: 18,
          successfulTrades: 12,
          totalProfit: 1250.75,
          winRate: 66.7
        },
        learning: {
          completedTopics: ['risk-management', 'technical-analysis', 'market-sentiment'],
          currentLevel: 'intermediate',
          improvementAreas: ['portfolio-diversification', 'advanced-charting'],
          knowledgeScore: 78
        },
        engagement: {
          dailyActiveMinutes: 45,
          weeklyActiveDays: 5,
          favoriteFeatures: ['trending-analysis', 'voice-commands', 'real-time-alerts'],
          responseAccuracy: 92.5
        },
        recommendations: {
          totalGenerated: 18,
          accepted: 12,
          rejected: 4,
          pending: 2,
          successRate: 75.0
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <p className="text-text-secondary">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-text-secondary">Track your AI trading assistant performance</p>
        </div>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Sessions</p>
              <p className="text-2xl font-bold">{analytics.performance.totalSessions}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <Badge variant="outline">+12% from last month</Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Win Rate</p>
              <p className="text-2xl font-bold">{analytics.performance.winRate}%</p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2">
            <Progress value={analytics.performance.winRate} className="h-2" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Profit</p>
              <p className="text-2xl font-bold">${analytics.performance.totalProfit.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-2">
            <Badge variant="outline" className="text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.5%
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Knowledge Score</p>
              <p className="text-2xl font-bold">{analytics.learning.knowledgeScore}/100</p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2">
            <Progress value={analytics.learning.knowledgeScore} className="h-2" />
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Performance Overview</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Average Session Time</span>
              <span className="font-medium">{analytics.performance.averageSessionTime} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Total Messages</span>
              <span className="font-medium">{analytics.performance.totalMessages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">AI Recommendations</span>
              <span className="font-medium">{analytics.performance.aiRecommendations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Successful Trades</span>
              <span className="font-medium">{analytics.performance.successfulTrades}</span>
            </div>
          </div>
        </Card>

        {/* Learning Progress */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Learning Progress</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-text-secondary">Current Level</span>
                <Badge variant="outline" className="capitalize">
                  {analytics.learning.currentLevel}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-2">Completed Topics</p>
              <div className="flex flex-wrap gap-1">
                {analytics.learning.completedTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-xs">
                    {topic.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-2">Areas for Improvement</p>
              <div className="flex flex-wrap gap-1">
                {analytics.learning.improvementAreas.map((area) => (
                  <Badge key={area} variant="outline" className="text-xs">
                    {area.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Engagement Metrics */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Engagement</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Daily Active Minutes</span>
              <span className="font-medium">{analytics.engagement.dailyActiveMinutes} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Weekly Active Days</span>
              <span className="font-medium">{analytics.engagement.weeklyActiveDays}/7</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Response Accuracy</span>
              <span className="font-medium">{analytics.engagement.responseAccuracy}%</span>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-2">Favorite Features</p>
              <div className="flex flex-wrap gap-1">
                {analytics.engagement.favoriteFeatures.map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Recommendation Analytics */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">AI Recommendations</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Total Generated</span>
              <span className="font-medium">{analytics.recommendations.totalGenerated}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Accepted</span>
              <span className="font-medium text-green-600">{analytics.recommendations.accepted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Rejected</span>
              <span className="font-medium text-red-600">{analytics.recommendations.rejected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Pending</span>
              <span className="font-medium text-yellow-600">{analytics.recommendations.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Success Rate</span>
              <span className="font-medium">{analytics.recommendations.successRate}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">AI Insights & Recommendations</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Great Performance!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your win rate of {analytics.performance.winRate}% is above average. 
                  Consider increasing position sizes gradually to maximize profits.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Award className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Learning Progress
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You&apos;re making excellent progress! Focus on portfolio diversification 
                  to further improve your trading strategy.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Engagement Tip
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You&apos;re using the AI assistant {analytics.engagement.dailyActiveMinutes} minutes daily. 
                  Try using voice commands for faster interactions!
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

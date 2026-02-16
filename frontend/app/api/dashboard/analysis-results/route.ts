export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';


interface PatternCorrelation {
  keyword: string;
  token_name?: string;
  token_symbol?: string;
  correlation_score: number;
  risk_level?: string;
  recommendation_text?: string;
}

interface AnalysisResult {
  id: number;
  analysis_type: string;
  platform: string;
  timestamp: string;
  summary: any;
  pattern_correlations?: PatternCorrelation[];
}

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://srsapzqvwxgrohisrwnm.supabase.co',
  process.env.SUPABASE_ANON_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc2FwenF2d3hncm9oaXNyd25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODg4MTUsImV4cCI6MjA2NzM2NDgxNX0.IGGaJcpeEGj-Y7Drb-HRvSL7bnsJdX1dFrHtvnfyKLI'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10');
    const platform = searchParams.get('platform');

    let query = supabase
      .from('pattern_analysis_results')
      .select(`
        *,
        pattern_correlations (
          keyword,
          token_name,
          token_symbol,
          correlation_score,
          risk_level,
          recommendation_text
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching analysis results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analysis results' },
        { status: 500 }
      );
    }

    // Transform the data to include recommendations
    const transformedData = (data as AnalysisResult[])?.map(result => {
      const recommendations = result.pattern_correlations?.map((corr: PatternCorrelation) => ({
        token: corr.token_name || corr.token_symbol,
        keyword: corr.keyword,
        correlation: corr.correlation_score,
        risk: corr.risk_level,
        recommendation: corr.recommendation_text || `High correlation (${(corr.correlation_score * 100).toFixed(1)}%) with ${corr.keyword}`
      })) || [];

      return {
        ...result,
        recommendations: recommendations.sort((a, b) => b.correlation - a.correlation).slice(0, 5)
      };
    }) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis results' },
      { status: 500 }
    );
  }
}

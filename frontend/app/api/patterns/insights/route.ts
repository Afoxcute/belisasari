export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const insightType = url.searchParams.get('insight_type');
    const tokenSymbol = url.searchParams.get('token_symbol');
    const hours = parseInt(url.searchParams.get('hours') || '24');

    console.log('🧠 Fetching pattern insights...');

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'Supabase configuration not available',
        filters: {
          limit,
          insightType,
          tokenSymbol,
          hours
        },
        timestamp: new Date().toISOString()
      });
    }

    let query = supabase
      .from('pattern_insights')
      .select('*')
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (insightType) {
      query = query.eq('insight_type', insightType);
    }

    if (tokenSymbol) {
      query = query.eq('token_symbol', tokenSymbol);
    }

    const { data: insights, error } = await query;

    if (error) {
      console.log('⚠️ Pattern insights table not found, using empty data');
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Pattern insights table not available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      data: insights || [],
      count: insights?.length || 0,
      filters: {
        limit,
        insightType,
        tokenSymbol,
        hours
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pattern insights API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pattern insights',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

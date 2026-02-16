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
    const patternType = url.searchParams.get('pattern_type');
    const tokenSymbol = url.searchParams.get('token_symbol');
    const hours = parseInt(url.searchParams.get('hours') || '24');

    console.log('🔍 Fetching pattern detections...');

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'Supabase configuration not available',
        filters: {
          limit,
          patternType,
          tokenSymbol,
          hours
        },
        timestamp: new Date().toISOString()
      });
    }

    let query = supabase
      .from('pattern_detections')
      .select('*')
      .gte('detected_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }

    if (tokenSymbol) {
      query = query.eq('token_symbol', tokenSymbol);
    }

    const { data: detections, error } = await query;

    if (error) {
      console.log('⚠️ Pattern detections table not found, using empty data');
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Pattern detections table not available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      data: detections || [],
      count: detections?.length || 0,
      filters: {
        limit,
        patternType,
        tokenSymbol,
        hours
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pattern detections API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pattern detections',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

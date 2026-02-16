export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';


const supabase = createClient(
  process.env.SUPABASE_URL || 'https://srsapzqvwxgrohisrwnm.supabase.co',
  process.env.SUPABASE_ANON_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc2FwenF2d3hncm9oaXNyd25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODg4MTUsImV4cCI6MjA2NzM2NDgxNX0.IGGaJcpeEGj-Y7Drb-HRvSL7bnsJdX1dFrHtvnfyKLI'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '20');
    const platform = searchParams.get('platform');

    let query = supabase
      .from('trending_keywords')
      .select('*')
      .order('frequency', { ascending: false })
      .limit(limit);

    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching trending keywords:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending keywords' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching trending keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending keywords' },
      { status: 500 }
    );
  }
}

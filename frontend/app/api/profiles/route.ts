export const dynamic = 'force-dynamic';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_ANON_SECRET || process.env.SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server configuration error: Supabase not configured' },
      { status: 503 }
    );
  }
  try {
    const { searchParams } = request.nextUrl;
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', walletAddress)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(data ? { profile: data } : { profile: null });
  } catch (err) {
    console.error('Profiles API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

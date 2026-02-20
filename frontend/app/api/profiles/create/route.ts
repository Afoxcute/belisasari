export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_SECRET || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, username, bio } = body as {
      walletAddress?: string;
      username?: string;
      bio?: string;
    };

    if (!walletAddress || !username?.trim()) {
      return NextResponse.json(
        { error: 'walletAddress and username are required' },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (normalizedUsername.length < 2) {
      return NextResponse.json(
        { error: 'Username must be at least 2 characters (letters, numbers, underscore)' },
        { status: 400 }
      );
    }

    const { data: existingByUsername } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existingByUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    const { data: existingByWallet } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', walletAddress)
      .maybeSingle();

    if (existingByWallet) {
      const { data: updated, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          username: normalizedUsername,
          metadata: typeof existingByWallet === 'object' ? { bio: bio || null } : { bio: bio || null },
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        })
        .eq('user_id', walletAddress)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: updateError.message || 'Failed to update profile' },
          { status: 500 }
        );
      }
      return NextResponse.json(updated);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: walletAddress,
        username: normalizedUsername,
        metadata: bio ? { bio } : {},
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(inserted);
  } catch (err) {
    console.error('Create profile API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

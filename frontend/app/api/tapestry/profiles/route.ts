export const dynamic = 'force-dynamic';

import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'walletAddress is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'TAPESTRY_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await socialfi.profiles.profilesList({
      apiKey,
      walletAddress,
    });
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = getTapestryErrorMessage(error, 'Failed to fetch profiles');
    console.error('Error fetching Tapestry profiles:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

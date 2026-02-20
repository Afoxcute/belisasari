export const dynamic = 'force-dynamic';

import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) {
    console.error('TAPESTRY_API_KEY is not configured');
    return NextResponse.json(
      { error: 'API configuration error' },
      { status: 500 }
    );
  }

  try {
    const response = await socialfi.identities.identitiesDetail({
      id: walletAddress,
      apiKey,
    });
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch identities';
    console.error('Error fetching identities:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

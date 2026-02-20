export const dynamic = 'force-dynamic';

import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const username = formData.get('username')?.toString();
  const ownerWalletAddress = formData.get('ownerWalletAddress')?.toString();
  const bio = formData.get('bio')?.toString();
  const image = formData.get('image')?.toString();

  if (!username || !ownerWalletAddress) {
    return NextResponse.json(
      { error: 'Username and owner wallet address are required' },
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
    const profile = await socialfi.profiles.findOrCreateCreate(
      { apiKey },
      {
        walletAddress: ownerWalletAddress,
        username,
        bio: bio || undefined,
        image: image || undefined,
        blockchain: 'SOLANA',
      }
    );
    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = getTapestryErrorMessage(error, 'Failed to create profile');
    console.error('Error creating Tapestry profile:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

/** GET suggested profiles to follow: ?identifier=walletAddress */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get('identifier');
  if (!identifier) {
    return NextResponse.json({ error: 'identifier (e.g. wallet address) required' }, { status: 400 });
  }
  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TAPESTRY_API_KEY not set' }, { status: 500 });
  }
  try {
    const data = await socialfi.profiles.suggestedDetail({ apiKey, identifier });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: getTapestryErrorMessage(e, 'Failed to fetch suggested profiles') },
      { status: 500 }
    );
  }
}

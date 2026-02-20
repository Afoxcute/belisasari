export const dynamic = 'force-dynamic';

import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

/** POST follow: body { startId (follower profile id), endId (followee profile id) } */
export async function POST(req: NextRequest) {
  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'TAPESTRY_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { startId, endId } = body;
    if (!startId || !endId) {
      return NextResponse.json(
        { error: 'startId and endId are required' },
        { status: 400 }
      );
    }
    await socialfi.followers.postFollowers({ apiKey }, { startId, endId });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = getTapestryErrorMessage(error, 'Failed to follow');
    console.error('Error following:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

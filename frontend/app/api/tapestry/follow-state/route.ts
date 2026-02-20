export const dynamic = 'force-dynamic';
import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startId = searchParams.get('startId');
  const endId = searchParams.get('endId');
  if (!startId || !endId) {
    return NextResponse.json({ error: 'startId and endId required' }, { status: 400 });
  }
  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TAPESTRY_API_KEY not set' }, { status: 500 });
  }
  try {
    const r = await socialfi.followers.stateList({ apiKey, startId, endId });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: getTapestryErrorMessage(e, 'Failed to get follow state') }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

/** GET following list for profile id */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('pageSize') || '20';

  if (!id) {
    return NextResponse.json({ error: 'Profile id is required' }, { status: 400 });
  }

  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'TAPESTRY_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await socialfi.profiles.followingList({
      apiKey,
      id,
      page,
      pageSize,
    });
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = getTapestryErrorMessage(error, 'Failed to fetch following');
    console.error('Error fetching following:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

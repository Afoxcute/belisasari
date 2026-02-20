export const dynamic = 'force-dynamic';

import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId') || undefined;
  const requestingProfileId = searchParams.get('requestingProfileId') || undefined;
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('pageSize') || '20';
  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'TAPESTRY_API_KEY is not configured' },
      { status: 500 }
    );
  }
  try {
    const response = await socialfi.contents.contentsList({
      apiKey,
      profileId,
      requestingProfileId,
      page,
      pageSize,
      namespace: 'primitives',
    });
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = getTapestryErrorMessage(error, 'Failed to fetch contents');
    console.error('Error fetching contents:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const { id, profileId, properties } = body;
    if (!id) {
      return NextResponse.json(
        { error: 'Content id is required' },
        { status: 400 }
      );
    }
    const response = await socialfi.contents.findOrCreateCreate(
      { apiKey },
      { id, profileId, properties: properties || [] }
    );
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = getTapestryErrorMessage(error, 'Failed to create content');
    console.error('Error creating content:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

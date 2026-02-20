export const dynamic = 'force-dynamic';
import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'TAPESTRY_API_KEY not set' }, { status: 500 });
  try {
    const r = await socialfi.profiles.profilesDetail({ apiKey, id });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: getTapestryErrorMessage(e, 'Failed to fetch profile') }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'TAPESTRY_API_KEY not set' }, { status: 500 });
  try {
    const body = await req.json();
    const { username, bio, image } = body;
    const r = await socialfi.profiles.profilesUpdate({ apiKey, id }, { username, bio, image });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: getTapestryErrorMessage(e, 'Failed to update profile') }, { status: 500 });
  }
}

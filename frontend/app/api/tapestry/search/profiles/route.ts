export const dynamic = 'force-dynamic';
import { getTapestryErrorMessage } from '@/lib/tapestry-error';
import { socialfi } from '@/lib/socialfi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('pageSize') || '20';
  if (!q?.trim()) return NextResponse.json({ error: 'q required' }, { status: 400 });
  const apiKey = process.env.TAPESTRY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'TAPESTRY_API_KEY not set' }, { status: 500 });
  try {
    const r = await socialfi.search.profilesList({ apiKey, query: q.trim(), page, pageSize });
    return NextResponse.json(r);
  } catch (e) {
    const msg = getTapestryErrorMessage(e, 'Search failed');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';


const supabase = createClient(
  process.env.SUPABASE_URL || 'https://srsapzqvwxgrohisrwnm.supabase.co',
  process.env.SUPABASE_ANON_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc2FwenF2d3hncm9oaXNyd25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODg4MTUsImV4cCI6MjA2NzM2NDgxNX0.IGGaJcpeEGj-Y7Drb-HRvSL7bnsJdX1dFrHtvnfyKLI'
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Total TikTok views API called');
    
    const { searchParams } = request.nextUrl;
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d, all
    const realtime = searchParams.get('realtime') === 'true';

    // If realtime is requested, set up SSE stream
    if (realtime) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          console.log('🔄 Starting real-time TikTok views stream...');
          
          // Initial data fetch
          fetchTikTokViews(timeRange).then(initialData => {
            const data = `data: ${JSON.stringify(initialData)}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Set up real-time subscription
          const subscription = supabase
            .channel('tiktok-views-realtime')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'tiktoks'
              },
              async (payload) => {
                try {
                  console.log('🔄 TikTok data changed, fetching updated views...');
                  const updatedData = await fetchTikTokViews(timeRange);
                  const data = `data: ${JSON.stringify(updatedData)}\n\n`;
                  controller.enqueue(encoder.encode(data));
                } catch (error) {
                  console.error('❌ Error in real-time update:', error);
                }
              }
            )
            .subscribe();

          // Keep connection alive
          const keepAlive = setInterval(() => {
            const keepAliveData = `data: ${JSON.stringify({ type: 'keepalive', timestamp: new Date().toISOString() })}\n\n`;
            controller.enqueue(encoder.encode(keepAliveData));
          }, 30000);

          // Cleanup on close
          request.signal.addEventListener('abort', () => {
            console.log('🔄 Real-time stream aborted');
            subscription.unsubscribe();
            clearInterval(keepAlive);
            controller.close();
          });

          request.signal.addEventListener('close', () => {
            console.log('🔄 Real-time stream closed');
            subscription.unsubscribe();
            clearInterval(keepAlive);
            controller.close();
          });
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      });
    }

    // Regular non-realtime response
    const data = await fetchTikTokViews(timeRange);
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Unexpected error in total TikTok views API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch total TikTok views', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

async function fetchTikTokViews(timeRange: string) {
  // Calculate time range
  let startTime: Date | null = null;
  switch (timeRange) {
    case '24h':
      startTime = new Date();
      startTime.setHours(startTime.getHours() - 24);
      break;
    case '7d':
      startTime = new Date();
      startTime.setDate(startTime.getDate() - 7);
      break;
    case '30d':
      startTime = new Date();
      startTime.setDate(startTime.getDate() - 30);
      break;
    case 'all':
    default:
      startTime = null;
      break;
  }

  console.log(`🔍 Fetching TikTok views for time range: ${timeRange}`);

  // Build the query
  let query = supabase
    .from('tiktoks')
    .select('views, fetched_at');

  // Add time filter if specified
  if (startTime) {
    query = query.gte('fetched_at', startTime.toISOString());
  }

  const { data: tiktoks, error: tiktoksError } = await query;

  if (tiktoksError) {
    console.error('❌ Error fetching TikTok data:', tiktoksError);
    throw tiktoksError;
  }

  // Calculate total views
  const totalViews = tiktoks.reduce((sum, tiktok) => sum + (tiktok.views || 0), 0);
  const totalVideos = tiktoks.length;

  console.log(`✅ Total TikTok views: ${totalViews} from ${totalVideos} videos`);

  return {
    totalViews,
    totalVideos,
    timeRange,
    lastUpdated: new Date().toISOString(),
    type: 'tiktok_views_update'
  };
}

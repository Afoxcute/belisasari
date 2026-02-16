export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';


const supabase = createClient(
  process.env.SUPABASE_URL || 'https://srsapzqvwxgrohisrwnm.supabase.co',
  process.env.SUPABASE_ANON_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc2FwenF2d3hncm9oaXNyd25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODg4MTUsImV4cCI6MjA2NzM2NDgxNX0.IGGaJcpeEGj-Y7Drb-HRvSL7bnsJdX1dFrHtvnfyKLI'
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Telegram recent data API called');

    const { searchParams } = request.nextUrl;
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d, all
    const realtime = searchParams.get('realtime') === 'true';

    // If realtime is requested, set up SSE stream
    if (realtime) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          console.log('🔄 Starting real-time Telegram data stream...');

          // Initial data fetch
          fetchTelegramData(timeRange).then(initialData => {
            const data = `data: ${JSON.stringify(initialData)}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Set up real-time subscription
          const subscription = supabase
            .channel('telegram-realtime')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'telegram_messages'
              },
              async (payload) => {
                try {
                  console.log('🔄 Telegram data changed, fetching updated data...');
                  const updatedData = await fetchTelegramData(timeRange);
                  const data = `data: ${JSON.stringify(updatedData)}\n\n`;
                  controller.enqueue(encoder.encode(data));
                } catch (error) {
                  console.error('❌ Error in real-time update:', error);
                }
              }
            )
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'telegram_channels'
              },
              async (payload) => {
                try {
                  console.log('🔄 Telegram channels changed, fetching updated data...');
                  const updatedData = await fetchTelegramData(timeRange);
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
    const data = await fetchTelegramData(timeRange);
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Unexpected error in Telegram recent data API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Telegram recent data',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

async function fetchTelegramData(timeRange: string) {
  // Calculate time range
  let startTime: Date | null = null;
  switch (timeRange) {
    case '1h':
      startTime = new Date();
      startTime.setHours(startTime.getHours() - 1);
      break;
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

  console.log(`🔍 Fetching Telegram data for time range: ${timeRange}`);

  try {
    // Fetch recent messages
    let messagesQuery = supabase
      .from('telegram_messages')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(100);

    // Add time filter if specified
    if (startTime) {
      messagesQuery = messagesQuery.gte('scraped_at', startTime.toISOString());
    }

    const { data: messages, error: messagesError } = await messagesQuery;

    if (messagesError) {
      console.error('❌ Error fetching Telegram messages:', messagesError);
      throw messagesError;
    }

    // Fetch active channels
    const { data: channels, error: channelsError } = await supabase
      .from('telegram_channels')
      .select('*')
      .eq('enabled', true);

    if (channelsError) {
      console.error('❌ Error fetching Telegram channels:', channelsError);
      throw channelsError;
    }

    // Extract trending keywords from messages
    const keywordCounts = new Map<string, number>();
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'a', 'an', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];

    messages?.forEach(message => {
      if (message.text) {
        const words = message.text.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter((word: string) => word.length > 3 && !commonWords.includes(word));
        
        // Process each word for keyword counting
        words.forEach((word: string) => {
          keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
        });
      }
    });

    const trendingKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // Calculate total messages and views
    const totalMessages = messages?.length || 0;
    const totalViews = messages?.reduce((sum, msg) => sum + (msg.views || 0), 0) || 0;
    const activeChannels = channels?.length || 0;

    console.log(`✅ Telegram data: ${totalMessages} messages, ${activeChannels} channels, ${trendingKeywords.length} keywords`);

    return {
      messages: messages || [],
      channels: channels || [],
      keywords: trendingKeywords,
      totalMessages,
      totalViews,
      activeChannels,
      timeRange,
      lastUpdated: new Date().toISOString(),
      type: 'telegram_update'
    };

  } catch (error) {
    console.error('❌ Error fetching Telegram data:', error);
    throw error;
  }
}

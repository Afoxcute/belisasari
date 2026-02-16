export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';


const supabase = createClient(
  process.env.SUPABASE_URL || 'https://srsapzqvwxgrohisrwnm.supabase.co',
  process.env.SUPABASE_ANON_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc2FwenF2d3hncm9oaXNyd25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODg4MTUsImV4cCI6MjA2NzM2NDgxNX0.IGGaJcpeEGj-Y7Drb-HRvSL7bnsJdX1dFrHtvnfyKLI'
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Telegram channels API called');

    const { searchParams } = request.nextUrl;
    const realtime = searchParams.get('realtime') === 'true';
    const enabled = searchParams.get('enabled');

    // If realtime is requested, set up SSE stream
    if (realtime) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          console.log('🔄 Starting real-time Telegram channels stream...');

          // Initial data fetch
          fetchTelegramChannels(enabled).then(initialData => {
            const data = `data: ${JSON.stringify(initialData)}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Set up real-time subscription
          const subscription = supabase
            .channel('telegram-channels-realtime')
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
                  const updatedData = await fetchTelegramChannels(enabled);
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
    const data = await fetchTelegramChannels(enabled);
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Unexpected error in Telegram channels API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Telegram channels',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

async function fetchTelegramChannels(enabled?: string | null) {
  console.log('🔍 Fetching Telegram channels...');

  try {
    // Build query
    let channelsQuery = supabase
      .from('telegram_channels')
      .select('*')
      .order('created_at', { ascending: false });

    // Add enabled filter if specified
    if (enabled !== null && enabled !== undefined) {
      const isEnabled = enabled === 'true';
      channelsQuery = channelsQuery.eq('enabled', isEnabled);
    }

    const { data: channels, error: channelsError } = await channelsQuery;

    if (channelsError) {
      console.error('❌ Error fetching Telegram channels:', channelsError);
      throw channelsError;
    }

    // Get message counts for each channel
    const channelsWithStats = await Promise.all(
      (channels || []).map(async (channel) => {
        try {
          // Get total message count
          const { count: totalMessages } = await supabase
            .from('telegram_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.username);

          // Get recent message count (last 24h)
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          const { count: recentMessages } = await supabase
            .from('telegram_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.username)
            .gte('scraped_at', yesterday.toISOString());

          // Get last message info
          const { data: lastMessage } = await supabase
            .from('telegram_messages')
            .select('scraped_at, text')
            .eq('channel_id', channel.username)
            .order('scraped_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...channel,
            stats: {
              totalMessages: totalMessages || 0,
              recentMessages: recentMessages || 0,
              lastMessageAt: lastMessage?.scraped_at || null,
              lastMessagePreview: lastMessage?.text ? 
                lastMessage.text.substring(0, 100) + (lastMessage.text.length > 100 ? '...' : '') : 
                null
            }
          };
        } catch (error) {
          console.error(`Error fetching stats for channel ${channel.username}:`, error);
          return {
            ...channel,
            stats: {
              totalMessages: 0,
              recentMessages: 0,
              lastMessageAt: null,
              lastMessagePreview: null
            }
          };
        }
      })
    );

    // Calculate summary statistics
    const totalChannels = channelsWithStats.length;
    const enabledChannels = channelsWithStats.filter(c => c.enabled).length;
    const totalMessages = channelsWithStats.reduce((sum, c) => sum + c.stats.totalMessages, 0);
    const recentMessages = channelsWithStats.reduce((sum, c) => sum + c.stats.recentMessages, 0);

    console.log(`✅ Telegram channels: ${totalChannels} total, ${enabledChannels} enabled, ${totalMessages} total messages, ${recentMessages} recent messages`);

    return {
      channels: channelsWithStats,
      summary: {
        totalChannels,
        enabledChannels,
        disabledChannels: totalChannels - enabledChannels,
        totalMessages,
        recentMessages
      },
      lastUpdated: new Date().toISOString(),
      type: 'telegram_channels_update'
    };

  } catch (error) {
    console.error('❌ Error fetching Telegram channels:', error);
    throw error;
  }
}

// PATCH endpoint to update channel settings
export async function PATCH(request: NextRequest) {
  try {
    console.log('🚀 Telegram channels PATCH called');

    const body = await request.json();
    const { id, enabled, scrape_interval_minutes, scrape_media } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (scrape_interval_minutes !== undefined) updateData.scrape_interval_minutes = scrape_interval_minutes;
    if (scrape_media !== undefined) updateData.scrape_media = scrape_media;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('telegram_channels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating Telegram channel:', error);
      return NextResponse.json(
        { error: 'Failed to update channel' },
        { status: 500 }
      );
    }

    console.log(`✅ Updated Telegram channel: ${data.username}`);
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Unexpected error in Telegram channels PATCH:', error);
    return NextResponse.json(
      {
        error: 'Failed to update Telegram channel',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

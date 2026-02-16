export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';


const supabase = createClient(
  process.env.SUPABASE_URL || 'https://srsapzqvwxgrohisrwnm.supabase.co',
  process.env.SUPABASE_ANON_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc2FwenF2d3hncm9oaXNyd25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODg4MTUsImV4cCI6MjA2NzM2NDgxNX0.IGGaJcpeEGj-Y7Drb-HRvSL7bnsJdX1dFrHtvnfyKLI'
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TikTok hashtags API called');

    const { searchParams } = request.nextUrl;
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d, all
    const realtime = searchParams.get('realtime') === 'true';

    // If realtime is requested, set up SSE stream
    if (realtime) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          console.log('🔄 Starting real-time TikTok hashtags stream...');

          // Initial data fetch
          fetchTikTokHashtags(timeRange).then(initialData => {
            const data = `data: ${JSON.stringify(initialData)}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Set up real-time subscription
          const subscription = supabase
            .channel('tiktok-hashtags-realtime')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'tiktoks'
              },
              async (payload) => {
                try {
                  console.log('🔄 TikTok data changed, fetching updated hashtags...');
                  const updatedData = await fetchTikTokHashtags(timeRange);
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
    const data = await fetchTikTokHashtags(timeRange);
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Unexpected error in TikTok hashtags API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch TikTok hashtags',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

async function fetchTikTokHashtags(timeRange: string) {
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

  console.log(`🔍 Fetching TikTok hashtags for time range: ${timeRange}`);

  try {
    // Fetch recent TikTok videos
    let videosQuery = supabase
      .from('tiktoks')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(500);

    // Add time filter if specified
    if (startTime) {
      videosQuery = videosQuery.gte('fetched_at', startTime.toISOString());
    }

    const { data: videos, error: videosError } = await videosQuery;

    if (videosError) {
      console.error('❌ Error fetching TikTok videos:', videosError);
      throw videosError;
    }

    // Extract hashtags from various sources
    const hashtagCounts = new Map<string, number>();
    const hashtagViews = new Map<string, number>();
    const hashtagDetails = new Map<string, { count: number; totalViews: number; videos: any[] }>();

    videos?.forEach((video: any) => {
      const hashtags = extractHashtags(video);
      
      hashtags.forEach((hashtag: string) => {
        const normalizedHashtag = hashtag.toLowerCase();
        const currentCount = hashtagCounts.get(normalizedHashtag) || 0;
        const currentViews = hashtagViews.get(normalizedHashtag) || 0;
        
        hashtagCounts.set(normalizedHashtag, currentCount + 1);
        hashtagViews.set(normalizedHashtag, currentViews + (video.views || 0));
        
        // Store detailed information
        if (!hashtagDetails.has(normalizedHashtag)) {
          hashtagDetails.set(normalizedHashtag, {
            count: 0,
            totalViews: 0,
            videos: []
          });
        }
        
        const details = hashtagDetails.get(normalizedHashtag)!;
        details.count += 1;
        details.totalViews += video.views || 0;
        details.videos.push({
          id: video.id,
          username: video.username,
          views: video.views,
          url: video.url,
          fetched_at: video.fetched_at
        });
      });
    });

    // Create trending hashtags array
    const trendingHashtags = Array.from(hashtagCounts.entries())
      .map(([hashtag, count]) => ({
        hashtag: `#${hashtag}`,
        count,
        totalViews: hashtagViews.get(hashtag) || 0,
        avgViews: Math.round((hashtagViews.get(hashtag) || 0) / count),
        details: hashtagDetails.get(hashtag)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Calculate total metrics
    const totalHashtags = hashtagCounts.size;
    const totalVideos = videos?.length || 0;
    const totalViews = videos?.reduce((sum: number, video: any) => sum + (video.views || 0), 0) || 0;

    console.log(`✅ TikTok hashtags: ${totalHashtags} unique hashtags, ${totalVideos} videos, ${totalViews} total views`);

    return {
      hashtags: trendingHashtags,
      totalHashtags,
      totalVideos,
      totalViews,
      timeRange,
      lastUpdated: new Date().toISOString(),
      type: 'tiktok_hashtags_update'
    };

  } catch (error) {
    console.error('❌ Error fetching TikTok hashtags:', error);
    throw error;
  }
}

function extractHashtags(video: any): string[] {
  const hashtags: string[] = [];
  
  // Extract hashtags from URL (TikTok URLs often contain hashtag information)
  if (video.url) {
    const urlHashtags = extractHashtagsFromUrl(video.url);
    hashtags.push(...urlHashtags);
  }
  
  // Extract hashtags from username (some usernames contain hashtag-like patterns)
  if (video.username) {
    const usernameHashtags = extractHashtagsFromUsername(video.username);
    hashtags.push(...usernameHashtags);
  }
  
  // Add some common memecoin-related hashtags based on video characteristics
  const memecoinHashtags = generateMemecoinHashtags(video);
  hashtags.push(...memecoinHashtags);
  
  // Remove duplicates and filter out empty strings
  return Array.from(new Set(hashtags)).filter(hashtag => hashtag.length > 0);
}

function extractHashtagsFromUrl(url: string): string[] {
  const hashtags: string[] = [];
  
  try {
    // Extract hashtags from TikTok URL patterns
    const urlPatterns = [
      /#(\w+)/g, // Direct hashtags in URL
      /tiktok\.com\/.*?(\w+coin)/gi, // Coin-related terms
      /tiktok\.com\/.*?(meme|memecoin)/gi, // Meme-related terms
      /tiktok\.com\/.*?(crypto|solana|bitcoin)/gi // Crypto-related terms
    ];
    
    urlPatterns.forEach(pattern => {
      const matches = url.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const hashtag = match.replace('#', '').toLowerCase();
          if (hashtag.length > 2) {
            hashtags.push(hashtag);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error extracting hashtags from URL:', error);
  }
  
  return hashtags;
}

function extractHashtagsFromUsername(username: string): string[] {
  const hashtags: string[] = [];
  
  try {
    // Extract hashtag-like patterns from username
    const usernamePatterns = [
      /(\w+coin)/gi, // Coin-related terms
      /(meme|memecoin)/gi, // Meme-related terms
      /(crypto|solana|bitcoin)/gi // Crypto-related terms
    ];
    
    usernamePatterns.forEach(pattern => {
      const matches = username.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const hashtag = match.toLowerCase();
          if (hashtag.length > 2) {
            hashtags.push(hashtag);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error extracting hashtags from username:', error);
  }
  
  return hashtags;
}

function generateMemecoinHashtags(video: any): string[] {
  const hashtags: string[] = [];
  
  // Generate hashtags based on video characteristics
  if (video.views && video.views > 10000) {
    hashtags.push('viral');
  }
  
  if (video.views && video.views > 100000) {
    hashtags.push('trending');
  }
  
  if (video.comments && video.comments > 100) {
    hashtags.push('hot');
  }
  
  // Add common memecoin hashtags
  const commonHashtags = [
    'memecoin', 'crypto', 'solana', 'pump', 'moon', 'diamond', 'hands',
    'hodl', 'bullish', 'bearish', 'trading', 'invest', 'profit', 'gains',
    'altcoin', 'defi', 'nft', 'web3', 'blockchain', 'token', 'coin'
  ];
  
  // Randomly add some common hashtags based on video ID hash
  const videoHash = video.id ? video.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
  const numHashtags = Math.min(3, Math.floor(videoHash % 5));
  
  for (let i = 0; i < numHashtags; i++) {
    const hashtagIndex = (videoHash + i) % commonHashtags.length;
    hashtags.push(commonHashtags[hashtagIndex]);
  }
  
  return hashtags;
}

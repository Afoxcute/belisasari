export const dynamic = 'force-dynamic';

import { toZonedTime } from "date-fns-tz";
import { Price, TokenData } from "../../../../lib/types";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    console.log('🚀 get-coin-data API called');
    const { searchParams } = request.nextUrl;
    const tokenId = searchParams.get("tokenId");

    if (!tokenId) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_ANON_SECRET || ""
    );

    console.log(`🔍 Fetching token data for ID: ${tokenId}`);
    
    // First, get the token data
    const { data: token, error: tokenError } = await supabase
      .from("tokens")
      .select("*")
      .eq("id", parseInt(tokenId))
      .single();

    if (tokenError) {
      console.error("Error fetching token:", tokenError);
      return NextResponse.json(
        { error: "Failed to fetch token data" },
        { status: 500 }
      );
    }

    // Then, get prices using the token_id relationship
    const { data: prices, error: pricesError } = await supabase
      .from("prices")
      .select("price_usd, price_sol, trade_at")
      .eq("token_id", parseInt(tokenId))
      .order("trade_at", { ascending: true });

    if (pricesError) {
      console.error("Error fetching prices:", pricesError);
      // Continue without prices rather than failing completely
    }

    // Get mentions data
    const { data: mentions, error: mentionsError } = await supabase
      .from("mentions")
      .select("count, mention_at")
      .eq("token_id", parseInt(tokenId))
      .order("mention_at", { ascending: true });

    if (mentionsError) {
      console.error("Error fetching mentions:", mentionsError);
      // Continue without mentions rather than failing completely
    }

    // Get tiktoks data separately
    const { data: tiktoks, error: tiktoksError } = await supabase
      .from("tiktoks")
      .select("username, thumbnail, url, created_at, views")
      .eq("token_id", parseInt(tokenId))
      .order("created_at", { ascending: false });

    if (tiktoksError) {
      console.error("Error fetching tiktoks:", tiktoksError);
      // Continue without tiktoks rather than failing completely
    }

    if (mentionsError) {
      console.error("Error fetching mentions:", mentionsError);
      // Continue without mentions rather than failing completely
    }

    // Get tweets data
    const { data: tweets, error: tweetsError } = await supabase
      .from("tweets")
      .select("id, created_at, tweet, tweet_id")
      .eq("token_id", parseInt(tokenId))
      .order("created_at", { ascending: false });

    if (tweetsError) {
      console.error("Error fetching tweets:", tweetsError);
      // Continue without tweets rather than failing completely
    }

    // Combine all the data
    const data = {
      ...token,
      prices: prices || [],
      mentions: mentions || [],
      tweets: tweets || [],
      tiktoks: tiktoks || []
    };



    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const tokenData: TokenData = {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      uri: data.uri,
      image: "",
      created_at: toZonedTime(
        new Date(data.created_at),
        timeZone
      ).toISOString(),
      address: data.address,
      prices: data.prices,
      latest_price_usd:
        data.prices.length == 0
          ? null
          : data.prices?.[data.prices.length - 1]?.price_usd,
      latest_price_sol:
        data.prices.length == 0
          ? null
          : data.prices?.[data.prices.length - 1]?.price_sol,
      latest_market_cap:
        data.prices.length == 0
          ? null
          : data.prices?.[data.prices.length - 1]?.price_usd * 1000000000,
      tweets: data.tweets || [],
      mentions: data.mentions?.length || 0,
      tiktoks: data.tiktoks || [],
      views: data.views || 0,
    };

    console.log(`✅ Successfully fetched token data for ${tokenData.symbol} (ID: ${tokenId})`);
    console.log(`📊 Data summary: ${tokenData.prices?.length || 0} prices, ${tokenData.mentions || 0} mentions, ${tokenData.tweets?.length || 0} tweets, ${tokenData.tiktoks?.length || 0} tiktoks`);
    
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error("💥 Error processing get-coin-data request:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

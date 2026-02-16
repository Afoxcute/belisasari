export const dynamic = 'force-dynamic';

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_SECRET;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const tokenId = searchParams.get("tokenId");

    let query = supabase
      .from("mentions")
      .select(`
        *,
        token:tokens(id, symbol, name),
        tiktok:tiktoks(id, username, url)
      `)
      .order("mention_at", { ascending: false });

    // Filter by specific token if provided
    if (tokenId) {
      query = query.eq("token_id", tokenId);
    }

    // Add pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch mentions data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching mentions data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

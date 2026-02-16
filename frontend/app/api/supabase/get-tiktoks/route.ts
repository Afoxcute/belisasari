// export const dynamic = 'force-dynamic'; // Disabled for static export

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FETCH_TIMEOUT_MS = 30_000;

/** Custom fetch with longer timeout to avoid "fetch failed" on slow networks. */
function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS);
  return fetch(input, {
    ...init,
    signal: init?.signal ?? controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    const supabaseKey = (process.env.SUPABASE_ANON_SECRET || "").trim();

    console.log('🔍 TikTok API called - checking credentials...');
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_ANON_SECRET:', supabaseKey ? '✅ Set' : '❌ Missing');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { fetch: customFetch },
    });
    console.log('✅ Supabase client created');

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const search = searchParams.get("search") || "";

    console.log(`🔍 Querying tiktoks table with limit: ${limit}, offset: ${offset}`);

    let query = supabase
      .from("tiktoks")
      .select("*")
      .order("fetched_at", { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`username.ilike.%${search}%,url.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      const isNetworkError = /fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|network/i.test(String(error.message));
      const hint = isNetworkError
        ? " Check SUPABASE_URL (e.g. https://xxx.supabase.co), network, firewall, and VPN."
        : "";
      return NextResponse.json(
        {
          error: "Failed to fetch TikTok data",
          details: error.message,
          hint: hint || undefined,
        },
        { status: 500 }
      );
    }

    console.log(`✅ TikTok data fetched successfully: ${data?.length || 0} records`);
    console.log('Sample data:', data?.slice(0, 2));

    // Ensure we always return a consistent structure
    const safeData = Array.isArray(data) ? data : [];
    const safeCount = typeof count === 'number' ? count : 0;

    return NextResponse.json({
      data: safeData,
      count: safeCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("❌ Error fetching TikTok data:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    const isNetworkError = /fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|network/i.test(String(message));
    const hint = isNetworkError
      ? " Check SUPABASE_URL in .env.local, network/firewall, and that Supabase project is reachable."
      : undefined;
    return NextResponse.json(
      {
        data: [],
        count: 0,
        limit: parseInt(request.nextUrl.searchParams.get("limit") || "50"),
        offset: parseInt(request.nextUrl.searchParams.get("offset") || "0"),
        error: "Internal server error",
        details: message,
        hint,
      },
      { status: 500 }
    );
  }
}

// export const dynamic = 'force-dynamic'; // Disabled for static export

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { SOL_MINT, USDC_MINT } from "@/lib/trading-constants";

const JUPITER_QUOTE_BASE = "https://quote-api.jup.ag/v6/quote";

// Helper function to clean up duplicate is_latest flags
async function cleanupDuplicateLatestFlags(supabase: any, tokenId: number) {
  try {
    const { data: allPrices, error: fetchError } = await supabase
      .from("prices")
      .select(`id, trade_at, is_latest`)
      .eq("token_id", tokenId)
      .order("trade_at", { ascending: false });

    if (fetchError || !allPrices?.length) return;

    const recordsToUpdate = allPrices
      .slice(1)
      .filter((p: { id: number; is_latest: boolean }) => p.is_latest);

    if (recordsToUpdate.length === 0) return;

    await supabase
      .from("prices")
      .update({ is_latest: false })
      .in("id", recordsToUpdate.map((p: { id: number }) => p.id));
  } catch (err) {
    console.error("Error during cleanup:", err);
  }
}

/** Fetch price from Jupiter quote API (1 token → USDC and 1 token → SOL). */
async function fetchJupiterPrices(
  tokenMint: string,
  decimals: number
): Promise<{ price_usd: number; price_sol: number } | null> {
  const amountRaw = Math.pow(10, decimals);
  let price_usd = 0;
  let price_sol = 0;

  try {
    if (tokenMint !== USDC_MINT) {
      const usdcRes = await fetch(
        `${JUPITER_QUOTE_BASE}?inputMint=${tokenMint}&outputMint=${USDC_MINT}&amount=${amountRaw}&slippageBps=50&swapMode=ExactIn`
      );
      const usdcData = await usdcRes.json();
      if (usdcRes.ok && usdcData?.outAmount) {
        price_usd = Number(usdcData.outAmount) / 1e6; // USDC 6 decimals
      }
    } else {
      price_usd = 1;
    }

    if (tokenMint !== SOL_MINT) {
      const solRes = await fetch(
        `${JUPITER_QUOTE_BASE}?inputMint=${tokenMint}&outputMint=${SOL_MINT}&amount=${amountRaw}&slippageBps=50&swapMode=ExactIn`
      );
      const solData = await solRes.json();
      if (solRes.ok && solData?.outAmount) {
        price_sol = Number(solData.outAmount) / 1e9; // SOL 9 decimals
      }
    } else {
      price_sol = 1;
    }

    if (price_usd === 0 && price_sol === 0) return null;
    return { price_usd, price_sol };
  } catch (e) {
    console.error("Jupiter quote error for", tokenMint, e);
    return null;
  }
}

/** Update token price using Jupiter quote API and store in Supabase. */
export async function POST(request: NextRequest) {
  try {
    const { tokenId } = await request.json();

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

    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("id, address")
      .eq("id", parseInt(tokenId))
      .single();

    if (tokenError || !tokenData?.address) {
      return NextResponse.json(
        { error: "Token not found" },
        { status: 404 }
      );
    }

    const decimals = Number((tokenData as { decimals?: number }).decimals) || 6;
    const prices = await fetchJupiterPrices(tokenData.address, decimals);

    if (!prices) {
      const { data: existing } = await supabase
        .from("prices")
        .select("price_usd, price_sol, trade_at")
        .eq("token_id", tokenData.id)
        .order("trade_at", { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({
        success: true,
        data: [],
        message: "No Jupiter quote available; returning existing data.",
        existingData: existing ?? null,
      });
    }

    await supabase
      .from("prices")
      .update({ is_latest: false })
      .eq("token_id", tokenData.id);

    const { error: insertError } = await supabase.from("prices").insert({
      token_id: tokenData.id,
      price_usd: prices.price_usd,
      price_sol: prices.price_sol,
      trade_at: new Date().toISOString(),
      is_latest: true,
    });

    if (insertError) {
      console.error("Error inserting price:", insertError);
      return NextResponse.json(
        { error: "Failed to save price" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: [
        {
          price_usd: prices.price_usd,
          price_sol: prices.price_sol,
          trade_at: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

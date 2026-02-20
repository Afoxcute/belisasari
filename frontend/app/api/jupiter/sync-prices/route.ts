import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { SOL_MINT, USDC_MINT } from "@/lib/trading-constants";

export const dynamic = "force-dynamic";

const JUPITER_QUOTE_BASE = "https://quote-api.jup.ag/v6/quote";

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
        price_usd = Number(usdcData.outAmount) / 1e6;
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
        price_sol = Number(solData.outAmount) / 1e9;
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

/** POST – Sync prices for all tokens (or given tokenIds) using Jupiter. */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_ANON_SECRET || ""
    );

    let tokenIds: number[] | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      if (Array.isArray(body.tokenIds) && body.tokenIds.length > 0) {
        tokenIds = body.tokenIds;
      }
    } catch {
      // no body
    }

    let query = supabase.from("tokens").select("id, address").not("address", "is", null);
    if (tokenIds && tokenIds.length > 0) {
      query = query.in("id", tokenIds);
    }
    const { data: tokens, error: tokensError } = await query.limit(200);

    if (tokensError || !tokens?.length) {
      return NextResponse.json({
        success: true,
        message: "No tokens to update",
        updated: 0,
        errors: [],
      });
    }

    const errors: string[] = [];
    let updated = 0;

    for (const token of tokens) {
      const address = token.address as string;
      const decimals = Number((token as { decimals?: number }).decimals) || 6;
      const prices = await fetchJupiterPrices(address, decimals);
      if (!prices) {
        errors.push(`No quote for token ${token.id}`);
        continue;
      }

      await supabase
        .from("prices")
        .update({ is_latest: false })
        .eq("token_id", token.id);

      const { error: insertError } = await supabase.from("prices").insert({
        token_id: token.id,
        price_usd: prices.price_usd,
        price_sol: prices.price_sol,
        trade_at: new Date().toISOString(),
        is_latest: true,
      });

      if (insertError) {
        errors.push(`Token ${token.id}: ${insertError.message}`);
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Jupiter price sync completed. Updated ${updated} tokens.`,
      updated,
      errors,
    });
  } catch (e) {
    console.error("Jupiter sync-prices error:", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}

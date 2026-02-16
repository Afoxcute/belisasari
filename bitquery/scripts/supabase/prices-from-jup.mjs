import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import fetch from "node-fetch";
import { Headers } from "node-fetch";

global.fetch = fetch;
global.Headers = Headers;

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
dotenv.config({ path: join(__dirname, "../../.env") });
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config({ path: join(__dirname, "../../../js-scraper/.env") });

/**
 * Build price rows from Jupiter token list. Uses stats24h for volume and price change.
 * @param {Array} jupTokens - Jupiter Tokens V2 mint objects
 * @param {string} [timestamp] - ISO timestamp for this run (default: now)
 */
function buildPriceRows(jupTokens, timestamp = new Date().toISOString()) {
  const rows = [];
  for (const t of jupTokens) {
    if (!t.id) continue;
    const stats24h = t.stats24h || {};
    const buyVol = Number(stats24h.buyVolume) || 0;
    const sellVol = Number(stats24h.sellVolume) || 0;
    const volume24h = buyVol + sellVol;
    rows.push({
      token_uri: t.id,
      price_usd: t.usdPrice != null ? Number(t.usdPrice) : null,
      price_sol: null, // Jupiter V2 does not expose SOL price in this shape
      trade_at: timestamp,
      timestamp,
      is_latest: true,
      volume_24h: volume24h || null,
      market_cap: t.mcap != null ? Number(t.mcap) : null,
      price_change_24h: stats24h.priceChange != null ? Number(stats24h.priceChange) : null,
      price_change_7d: null,
      price_change_30d: null,
      high_24h: null,
      low_24h: null,
      metadata: {
        liquidity: t.liquidity,
        fdv: t.fdv,
        organicScore: t.organicScore,
      },
    });
  }
  return rows;
}

/**
 * Push Jupiter token data to Supabase prices table. Resolves token_id from tokens by uri.
 * @param {Array} jupTokens - Jupiter Tokens V2 mint objects
 * @param {string} [timestamp] - ISO timestamp for this run
 */
/** Use service role key for writes so RLS is bypassed; anon key cannot insert/update prices. */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_SECRET;
  if (!supabaseUrl) {
    console.error("Missing SUPABASE_URL");
    process.exit(1);
  }
  const key = serviceKey || anonKey;
  if (!key) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_SECRET. For writes, set SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).");
    process.exit(1);
  }
  if (!serviceKey) {
    console.warn("Using SUPABASE_ANON_SECRET; if you get RLS errors, set SUPABASE_SERVICE_ROLE_KEY for this script.");
  }
  return createClient(supabaseUrl, key);
}

export async function pushPricesFromJup(jupTokens, timestamp = new Date().toISOString()) {
  const supabase = getSupabaseClient();
  const priceRows = buildPriceRows(jupTokens, timestamp);
  if (priceRows.length === 0) {
    console.log("No price rows to push.");
    return;
  }

  const uris = [...new Set(priceRows.map((r) => r.token_uri))];
  const { data: tokensData, error: tokensError } = await supabase
    .from("tokens")
    .select("id, uri")
    .in("uri", uris);

  if (tokensError) {
    console.error("Error fetching tokens for price push:", tokensError);
    throw tokensError;
  }

  const uriToTokenId = (tokensData || []).reduce((acc, row) => {
    acc[row.uri] = row.id;
    return acc;
  }, {});

  const updates = [];
  for (const row of priceRows) {
    const tokenId = uriToTokenId[row.token_uri];
    if (!tokenId) continue;
    updates.push({
      token_id: tokenId,
      token_uri: row.token_uri,
      price_usd: row.price_usd,
      price_sol: row.price_sol,
      trade_at: row.trade_at,
      timestamp: row.timestamp,
      is_latest: row.is_latest,
      volume_24h: row.volume_24h,
      market_cap: row.market_cap,
      price_change_24h: row.price_change_24h,
      price_change_7d: row.price_change_7d,
      price_change_30d: row.price_change_30d,
      high_24h: row.high_24h,
      low_24h: row.low_24h,
      metadata: row.metadata,
    });
  }

  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from("prices")
      .upsert(batch, { onConflict: "token_uri,timestamp", ignoreDuplicates: false });
    if (error) {
      console.error(`Error updating prices batch at index ${i}:`, error);
      throw error;
    }
    console.log(`Prices batch ${i}–${i + batch.length} updated.`);
  }
  console.log(`Prices push complete: ${updates.length} rows.`);
}

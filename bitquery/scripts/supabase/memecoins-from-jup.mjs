import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Polyfill for Node.js compatibility
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

const sanitize = (str) => (str != null && typeof str === "string" ? str.replace(/\u0000/g, "") : str);

/** Coerce to integer for BIGINT column; Jupiter returns float (e.g. totalSupply). */
function toBigIntSafe(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

/**
 * Map Jupiter token object to Supabase tokens table row.
 * @param {Object} jupToken - Jupiter Tokens V2 mint object
 */
function jupToTokenRow(jupToken) {
  const uri = sanitize(jupToken.id); // mint address as canonical uri
  if (!uri) return null;
  return {
    uri,
    name: sanitize(jupToken.name) ?? null,
    symbol: sanitize(jupToken.symbol) ?? null,
    description: null,
    image_url: sanitize(jupToken.icon) ?? null,
    address: sanitize(jupToken.id) ?? null,
    create_tx: null, // Jupiter does not provide
    market_cap: jupToken.mcap != null ? Number(jupToken.mcap) : null,
    total_supply: toBigIntSafe(jupToken.totalSupply),
    decimals: jupToken.decimals ?? 9,
    created_at: jupToken.firstPool?.createdAt ?? jupToken.updatedAt ?? new Date().toISOString(),
    updated_at: jupToken.updatedAt ?? new Date().toISOString(),
    last_updated: jupToken.updatedAt ?? new Date().toISOString(),
    views: 0,
    mentions: 0,
    metadata: {
      tags: jupToken.tags ?? [],
      organicScore: jupToken.organicScore,
      organicScoreLabel: jupToken.organicScoreLabel,
      isVerified: jupToken.isVerified,
      holderCount: jupToken.holderCount,
      liquidity: jupToken.liquidity,
      fdv: jupToken.fdv,
      cexes: jupToken.cexes,
      ...(jupToken.audit && { audit: jupToken.audit }),
    },
  };
}

/**
 * Push Jupiter token list to Supabase tokens table (upsert by uri).
 * @param {Array} jupTokens - Array of Jupiter Tokens V2 mint objects
 */
/** Use service role key for writes so RLS is bypassed; anon key cannot insert/update tokens. */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_SECRET || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl) {
    console.error("Missing SUPABASE_URL");
    process.exit(1);
  }
  const key = serviceKey || anonKey;
  if (!key) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_SECRET/SUPABASE_ANON_KEY. For writes (tokens/prices), set SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).");
    process.exit(1);
  }
  if (!serviceKey) {
    console.warn("Using anon key; if you get RLS errors, set SUPABASE_SERVICE_ROLE_KEY for this script.");
  }
  return createClient(supabaseUrl, key);
}

export async function pushMemecoinsFromJup(jupTokens) {
  const supabase = getSupabaseClient();
  const rows = [];
  for (const t of jupTokens) {
    const row = jupToTokenRow(t);
    if (row) rows.push(row);
  }

  if (rows.length === 0) {
    console.log("No token rows to push.");
    return;
  }

  const uniqueByUri = [...new Map(rows.map((r) => [r.uri, r])).values()];
  const batchSize = 300;
  for (let i = 0; i < uniqueByUri.length; i += batchSize) {
    const batch = uniqueByUri.slice(i, i + batchSize);
    const { error } = await supabase.from("tokens").upsert(batch, { onConflict: "uri" });
    if (error) {
      console.error(`Failed to upsert tokens batch at ${i}:`, error);
      throw error;
    }
    console.log(`Upserted tokens batch ${i}–${i + batch.length}`);
  }
  console.log(`Push complete: ${uniqueByUri.length} tokens.`);
}

#!/usr/bin/env node
/**
 * Search tokens via Jupiter Tokens API V2 (by symbol, name, or mint address).
 * Usage: node scripts/search-tokens.mjs <query> [limit]
 * Example: node scripts/search-tokens.mjs BONK 20
 */

import { search } from "./jup-api.mjs";
import fetch from "node-fetch";
import { Headers } from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

global.fetch = fetch;
global.Headers = Headers;

dotenv.config();
dotenv.config({ path: join(__dirname, "../.env") });
dotenv.config({ path: join(__dirname, "../../.env") });

const query = process.argv[2];
const limit = process.argv[3] ? parseInt(process.argv[3], 10) : 20;

if (!query || !query.trim()) {
  console.error("Usage: node scripts/search-tokens.mjs <query> [limit]");
  console.error("  query: symbol, name, or mint address (comma-separate for multiple, max 100)");
  console.error("  limit: max results (default 20)");
  process.exit(1);
}

async function main() {
  try {
    const results = await search(query.trim(), { limit });
    if (!Array.isArray(results)) {
      console.log(results);
      return;
    }
    console.log(`Found ${results.length} token(s):\n`);
    for (const t of results) {
      console.log(`  ${t.symbol || "—"} | ${t.name || "—"} | ${t.id}`);
      console.log(`    price: $${t.usdPrice ?? "—"} | mcap: ${t.mcap ?? "—"} | verified: ${!!t.isVerified}`);
    }
  } catch (e) {
    console.error("Search failed:", e.message);
    process.exit(1);
  }
}

main();

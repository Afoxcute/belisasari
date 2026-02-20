import { NextRequest, NextResponse } from "next/server";
import type { JupiterTokenV2 } from "@/lib/types/jupiter";
import { DEFAULT_TOKENS } from "@/lib/trading-constants";

export const dynamic = "force-dynamic";

const TOKENS_V2_BASE = "https://api.jup.ag/tokens/v2";

/** Map Tokens V2 item to ITokenSearchResult shape for the client */
function mapV2ToResult(t: JupiterTokenV2) {
  return {
    address: t.id,
    symbol: t.symbol ?? "?",
    name: t.name ?? "Unknown",
    decimals: t.decimals ?? 6,
    logoURI: t.icon ?? undefined,
    price: t.usdPrice ?? undefined,
    market_cap: t.mcap ?? undefined,
    verified: t.isVerified ?? undefined,
  };
}

const LIST_ENDPOINTS: Record<string, string> = {
  verified: `${TOKENS_V2_BASE}/tag?query=verified`,
  lst: `${TOKENS_V2_BASE}/tag?query=lst`,
  trending: `${TOKENS_V2_BASE}/toptrending/1h`,
  toptraded: `${TOKENS_V2_BASE}/toptraded/24h`,
  toporganic: `${TOKENS_V2_BASE}/toporganicscore/5m`,
  recent: `${TOKENS_V2_BASE}/recent`,
};

/** GET ?list=verified|trending|recent|toptraded|toporganic|lst - Tokens V2 list. Uses JUPITER_API_KEY or JUPITER_ULTRA_API_KEY. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const list = searchParams.get("list")?.toLowerCase() ?? "verified";
  const apiKey = process.env.JUPITER_API_KEY || process.env.JUPITER_ULTRA_API_KEY;
  const url = LIST_ENDPOINTS[list] || LIST_ENDPOINTS.verified;

  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (apiKey) headers["x-api-key"] = apiKey;

    const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(DEFAULT_TOKENS);
    }

    const arr = Array.isArray(data) ? data : [];
    return NextResponse.json(arr.map(mapV2ToResult));
  } catch (e) {
    console.error("Jupiter Tokens V2 list error:", e);
    return NextResponse.json(DEFAULT_TOKENS);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_TOKENS } from "@/lib/trading-constants";

export const dynamic = "force-dynamic";

const ULTRA_BASE = "https://api.jup.ag/ultra/v1";
const TOKEN_STRICT_URL = "https://token.jup.ag/strict";

/** Map token list item to Ultra-style (MintInformation) for client */
function mapToUltra(t: { address?: string; symbol?: string; name?: string; decimals?: number; logoURI?: string }) {
  return {
    id: t.address ?? "",
    symbol: t.symbol ?? "?",
    name: t.name ?? "Unknown",
    icon: t.logoURI ?? null,
    decimals: t.decimals ?? 6,
  };
}

/** Static fallback when network or API fails */
const STATIC_FALLBACK = [
  ...DEFAULT_TOKENS,
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVlM7rcOU3oQxZ0T5Ty5b4mA",
  },
  {
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    symbol: "WIF",
    name: "dogwifhat",
    decimals: 6,
    logoURI: "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6bex2pnjwv5s5qup2fz4eq.ipfs.nftstorage.link",
  },
].map((t) => mapToUltra(t));

function filterStatic(query: string): unknown[] {
  const q = query.trim().toLowerCase();
  if (!q) return STATIC_FALLBACK;
  return STATIC_FALLBACK.filter(
    (t: { id?: string; symbol?: string; name?: string }) =>
      t.symbol?.toLowerCase().includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      (t.id && t.id.toLowerCase().includes(q))
  );
}

/** Fallback when no API key or when Jupiter is unreachable */
async function fallbackSearch(query: string): Promise<unknown[]> {
  try {
    const res = await fetch(TOKEN_STRICT_URL, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const list = await res.json();
    if (!Array.isArray(list)) return filterStatic(query);
    const q = query.toLowerCase();
    if (!q) return list.slice(0, 30).map((t: { address?: string; symbol?: string; name?: string; decimals?: number; logoURI?: string }) => mapToUltra(t));
    const filtered = list.filter(
      (t: { address?: string; symbol?: string; name?: string }) =>
        t.symbol?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q) ||
        (t.address && t.address.toLowerCase().includes(q))
    );
    return filtered.slice(0, 50).map((t: { address?: string; symbol?: string; name?: string; decimals?: number; logoURI?: string }) => mapToUltra(t));
  } catch {
    return filterStatic(query);
  }
}

/** GET ?query=... - Token search via Jupiter Ultra Search. Uses JUPITER_API_KEY or JUPITER_ULTRA_API_KEY. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const apiKey = process.env.JUPITER_API_KEY || process.env.JUPITER_ULTRA_API_KEY;

  try {
    if (!apiKey) {
      const list = await fallbackSearch(query || "SOL");
      return NextResponse.json(list);
    }

    const url = query
      ? `${ULTRA_BASE}/search?query=${encodeURIComponent(query)}`
      : `${ULTRA_BASE}/search?query=SOL`;
    const res = await fetch(url, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();

    if (res.status === 401) {
      const list = await fallbackSearch(query || "SOL");
      return NextResponse.json(list);
    }

    if (!res.ok) {
      const list = filterStatic(query);
      return NextResponse.json(list);
    }

    const list = Array.isArray(data) ? data : [];
    return NextResponse.json(list);
  } catch (e) {
    console.error("Jupiter Ultra search error:", e);
    const list = filterStatic(query);
    return NextResponse.json(list);
  }
}

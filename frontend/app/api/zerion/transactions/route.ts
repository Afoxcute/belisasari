import { NextRequest, NextResponse } from "next/server";

const ZERION_BASE = "https://api.zerion.io";

function getAuthHeader(): string | null {
  const key = process.env.ZERION_API_KEY;
  if (!key?.trim()) return null;
  const encoded = Buffer.from(`${key.trim()}:`).toString("base64");
  return `Basic ${encoded}`;
}

/** GET /api/zerion/transactions?address=...&page[size]=20 - Proxy to Zerion wallet transactions. */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const pageSize = req.nextUrl.searchParams.get("page[size]") || "20";
  const cursor = req.nextUrl.searchParams.get("page[cursor]");

  if (!address?.trim()) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const auth = getAuthHeader();
  if (!auth) {
    return NextResponse.json(
      { error: "Zerion API key not configured (ZERION_API_KEY)" },
      { status: 503 }
    );
  }

  try {
    const url = new URL(`/v1/wallets/${encodeURIComponent(address)}/transactions`, ZERION_BASE);
    url.searchParams.set("page[size]", pageSize);
    if (cursor) url.searchParams.set("page[cursor]", cursor);

    const res = await fetch(url.toString(), {
      headers: { Authorization: auth, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.errors?.[0]?.detail || res.statusText, ...data },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Zerion transactions error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

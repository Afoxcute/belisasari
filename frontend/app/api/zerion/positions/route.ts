import { NextRequest, NextResponse } from "next/server";

const ZERION_BASE = "https://api.zerion.io";

function getAuthHeader(): string | null {
  const key = process.env.ZERION_API_KEY;
  if (!key?.trim()) return null;
  const encoded = Buffer.from(`${key.trim()}:`).toString("base64");
  return `Basic ${encoded}`;
}

/** GET /api/zerion/positions?address=...&currency=usd */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const currency = req.nextUrl.searchParams.get("currency") || "usd";
  const filterPositions = req.nextUrl.searchParams.get("filter[positions]") || "no_filter";
  const pageSize = req.nextUrl.searchParams.get("page[size]") || "50";

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
    const url = new URL(`/v1/wallets/${encodeURIComponent(address)}/positions`, ZERION_BASE);
    url.searchParams.set("currency", currency);
    url.searchParams.set("filter[positions]", filterPositions);
    url.searchParams.set("page[size]", pageSize);

    const res = await fetch(url.toString(), {
      headers: { Authorization: auth, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60000),
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
    console.error("Zerion positions error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

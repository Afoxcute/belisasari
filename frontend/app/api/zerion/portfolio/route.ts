import { NextRequest, NextResponse } from "next/server";

const ZERION_BASE = "https://api.zerion.io";

function getAuthHeader(): string | null {
  const key = process.env.ZERION_API_KEY;
  if (!key?.trim()) return null;
  const encoded = Buffer.from(key.trim() + ":").toString("base64");
  return "Basic " + encoded;
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const currency = req.nextUrl.searchParams.get("currency") || "usd";
  const filterPositions = req.nextUrl.searchParams.get("filter[positions]") || "no_filter";

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
    const url = new URL("/v1/wallets/" + encodeURIComponent(address) + "/portfolio", ZERION_BASE);
    url.searchParams.set("currency", currency);
    url.searchParams.set("filter[positions]", filterPositions);

    const res = await fetch(url.toString(), {
      headers: { Authorization: auth, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errDetail = data?.errors?.[0]?.detail || res.statusText;
      return NextResponse.json({ error: errDetail, ...data }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Zerion portfolio error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

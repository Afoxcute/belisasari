import { NextRequest, NextResponse } from "next/server";

const ZERION_BASE = "https://api.zerion.io";

const VALID_PERIODS = ["hour", "day", "week", "month", "3months", "6months", "year", "5years", "max"] as const;

function getAuthHeader(): string | null {
  const key = process.env.ZERION_API_KEY;
  if (!key?.trim()) return null;
  const encoded = Buffer.from(`${key.trim()}:`).toString("base64");
  return `Basic ${encoded}`;
}

/** GET /api/zerion/chart?address=...&period=day&currency=usd - Proxy to Zerion wallet balance chart. */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const period = (req.nextUrl.searchParams.get("period") || "day").toLowerCase();
  const currency = req.nextUrl.searchParams.get("currency") || "usd";

  if (!address?.trim()) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }
  if (!VALID_PERIODS.includes(period as (typeof VALID_PERIODS)[number])) {
    return NextResponse.json(
      { error: `period must be one of: ${VALID_PERIODS.join(", ")}` },
      { status: 400 }
    );
  }

  const auth = getAuthHeader();
  if (!auth) {
    return NextResponse.json(
      { error: "Zerion API key not configured (ZERION_API_KEY)" },
      { status: 503 }
    );
  }

  try {
    const url = new URL(
      `/v1/wallets/${encodeURIComponent(address)}/charts/${period}`,
      ZERION_BASE
    );
    url.searchParams.set("currency", currency);

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
    console.error("Zerion chart error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch chart" },
      { status: 500 }
    );
  }
}

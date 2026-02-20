import { NextRequest, NextResponse } from "next/server";

/** Forward signed transaction to Jupiter Ultra execute; requires JUPITER_ULTRA_API_KEY */
export const dynamic = "force-dynamic";

const ULTRA_BASE = "https://api.jup.ag/ultra/v1";

export async function POST(req: NextRequest) {
  const apiKey = process.env.JUPITER_ULTRA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "JUPITER_ULTRA_API_KEY not configured" },
      { status: 501 }
    );
  }
  try {
    const body = await req.json();
    const { requestId, signedTransaction } = body;

    if (!requestId || !signedTransaction) {
      return NextResponse.json(
        { error: "Missing requestId or signedTransaction" },
        { status: 400 }
      );
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };
    const apiKey = process.env.JUPITER_ULTRA_API_KEY;
    if (apiKey) headers["x-api-key"] = apiKey;

    const res = await fetch(`${ULTRA_BASE}/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify({ requestId, signedTransaction }),
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Ultra execute failed" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Jupiter Ultra execute error:", e);
    return NextResponse.json(
      { error: "Failed to execute swap" },
      { status: 500 }
    );
  }
}

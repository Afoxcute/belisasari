import { NextRequest, NextResponse } from "next/server";

/** Forward all Jupiter Ultra order params; requires JUPITER_ULTRA_API_KEY */
export const dynamic = "force-dynamic";

const ULTRA_BASE = "https://api.jup.ag/ultra/v1";

const OPTIONAL_PARAMS = [
  "swapMode",
  "slippageBps",
  "referralAccount",
  "referralFee",
  "receiver",
  "payer",
  "closeAuthority",
  "broadcastFeeType",
  "priorityFeeLamports",
  "jitoTipLamports",
];

export async function GET(req: NextRequest) {
  const apiKey = process.env.JUPITER_ULTRA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "JUPITER_ULTRA_API_KEY not configured" },
      { status: 501 }
    );
  }

  const { searchParams } = new URL(req.url);
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const taker = searchParams.get("taker") ?? undefined;

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "Missing inputMint, outputMint, or amount" },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: String(amount),
    });
    if (taker) params.set("taker", taker);
    for (const key of OPTIONAL_PARAMS) {
      const v = searchParams.get(key);
      if (v != null && v !== "") params.set(key, v);
    }

    const headers: HeadersInit = { "Content-Type": "application/json", "x-api-key": apiKey };
    const res = await fetch(`${ULTRA_BASE}/order?${params.toString()}`, {
      headers,
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Ultra order failed" },
        { status: res.status }
      );
    }
    if (data.error) {
      return NextResponse.json(
        { error: data.error, errorCode: data.errorCode, errorMessage: data.errorMessage },
        { status: 400 }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Jupiter Ultra order error:", e);
    return NextResponse.json(
      { error: "Failed to get order" },
      { status: 500 }
    );
  }
}

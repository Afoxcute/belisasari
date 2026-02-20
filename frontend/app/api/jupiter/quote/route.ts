import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = searchParams.get("slippageBps") || "50";
  const swapMode = searchParams.get("swapMode") || "ExactIn";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "Missing inputMint, outputMint, or amount" },
      { status: 400 }
    );
  }

  try {
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&swapMode=${swapMode}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Jupiter quote error" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("Jupiter quote error:", e);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

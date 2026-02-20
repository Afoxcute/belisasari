import { SwapService } from "@/lib/swap-service";
import type { SwapRouteResponse } from "@/lib/types/jupiter";
import { Connection } from "@solana/web3.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const rpcUrl =
  process.env.RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://api.mainnet-beta.solana.com";
const connection = new Connection(rpcUrl);
const swapService = new SwapService(connection);

export async function POST(
  request: Request
): Promise<NextResponse<SwapRouteResponse | { error: string }>> {
  try {
    const body = await request.json();
    const result = await swapService.createSwapTransaction({
      quoteResponse: body.quoteResponse,
      walletAddress: body.walletAddress,
      mintAddress: body.mintAddress,
      slippageMode: body.slippageMode ?? "auto",
      slippageBps: body.slippageBps ?? 50,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to build swap";
    console.error("Jupiter swap error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

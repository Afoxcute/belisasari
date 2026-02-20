import { Connection, PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";
const rpc =
  process.env.RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  PUBLIC_RPC;

function is403Blocked(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("403") || msg.includes("Forbidden") || msg.includes("blocked");
}

/** GET ?wallet=... - Native SOL balance (lamports). Requires RPC_URL in .env (public RPC blocks server IPs). */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }
  try {
    const connection = new Connection(rpc);
    const balance = await connection.getBalance(new PublicKey(wallet), "confirmed");
    return NextResponse.json({ value: balance });
  } catch (e) {
    console.error("SOL balance error:", e);
    if (is403Blocked(e) && rpc === PUBLIC_RPC) {
      return NextResponse.json(
        {
          error: "RPC blocked (403). Set RPC_URL in .env to a dedicated RPC (e.g. Helius: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY).",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}

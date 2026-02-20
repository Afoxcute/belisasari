import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get("walletAddress");
  const mintAddress = searchParams.get("mintAddress");
  if (!walletAddress || !mintAddress) {
    return NextResponse.json(
      { error: "walletAddress and mintAddress required" },
      { status: 400 }
    );
  }
  try {
    const rpc =
      process.env.RPC_URL ||
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpc);
    const ata = await getAssociatedTokenAddress(
      new PublicKey(mintAddress),
      new PublicKey(walletAddress)
    );
    const account = await connection.getTokenAccountBalance(ata).catch(() => null);
    if (!account?.value) {
      return NextResponse.json({
        balance: { uiAmount: 0, uiAmountString: "0", amount: "0", decimals: 6 },
      });
    }
    return NextResponse.json({
      balance: {
        uiAmount: account.value.uiAmount,
        uiAmountString: account.value.uiAmountString ?? "0",
        amount: account.value.amount,
        decimals: account.value.decimals,
      },
    });
  } catch (e) {
    console.error("Token balance error:", e);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}

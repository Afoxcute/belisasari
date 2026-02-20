import { JUPITER_CONFIG } from "@/lib/jupiter-config";
import {
  buildTransactionMessage,
  fetchSwapInstructions,
  getAddressLookupTableAccounts,
  simulateTransaction,
} from "@/lib/jupiter-service";
import type { SwapRouteResponse } from "@/lib/types/jupiter";
import { getCreateATAInstructions } from "@/lib/token-ata";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";

export interface SwapRequest {
  quoteResponse: unknown;
  walletAddress: string;
  mintAddress: string;
  slippageMode: "auto" | "fixed";
  slippageBps: number;
}

export class SwapService {
  constructor(private connection: Connection) {}

  async buildSwapTransaction(
    request: SwapRequest,
    outputAta: PublicKey,
    additionalInstructions: unknown[] = []
  ): Promise<{
    transaction: VersionedTransaction;
    swapResponse: unknown;
    addressLookupTableAccounts: Awaited<
      ReturnType<typeof getAddressLookupTableAccounts>
    >;
  }> {
    const quote = request.quoteResponse as { slippageBps?: number };
    const effectiveSlippageBps =
      request.slippageMode === "auto"
        ? quote.slippageBps ?? JUPITER_CONFIG.DEFAULT_SLIPPAGE_BPS
        : request.slippageBps;

    const swapResponse = await fetchSwapInstructions({
      quoteResponse: request.quoteResponse as Parameters<
        typeof fetchSwapInstructions
      >[0]["quoteResponse"],
      userPublicKey: request.walletAddress,
      feeAccount: outputAta.toString(),
      slippageBps: effectiveSlippageBps,
    });

    const addressLookupTableAccounts = await getAddressLookupTableAccounts(
      this.connection,
      swapResponse.addressLookupTableAddresses || []
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    const message = buildTransactionMessage(
      new PublicKey(request.walletAddress),
      blockhash,
      swapResponse,
      addressLookupTableAccounts,
      additionalInstructions as Parameters<typeof buildTransactionMessage>[4]
    );

    return {
      transaction: new VersionedTransaction(message),
      swapResponse,
      addressLookupTableAccounts,
    };
  }

  async createSwapTransaction(request: SwapRequest): Promise<SwapRouteResponse> {
    const wallet = new PublicKey(request.walletAddress);
    const mint = new PublicKey(request.mintAddress);
    const { ata: outputAta, instructions: ataInstructions } =
      await getCreateATAInstructions(this.connection, wallet, mint, wallet);

    const { transaction, swapResponse, addressLookupTableAccounts } =
      await this.buildSwapTransaction(request, outputAta, ataInstructions);

    try {
      await simulateTransaction(
        this.connection,
        transaction,
        addressLookupTableAccounts
      );
    } catch (e) {
      console.error("Simulate transaction error:", e);
    }

    const swap = swapResponse as {
      lastValidBlockHeight?: number;
      computeUnitLimit?: number;
      prioritizationFeeLamports?: number;
    };
    return {
      transaction: Buffer.from(transaction.serialize()).toString("base64"),
      lastValidBlockHeight: swap.lastValidBlockHeight,
      computeUnitLimit: swap.computeUnitLimit,
      prioritizationFeeLamports: swap.prioritizationFeeLamports,
    };
  }
}

import type {
  SwapInstructionsRequest,
  SwapInstructionsResponse,
} from "@/lib/types/jupiter";
import {
  AddressLookupTableAccount,
  Connection,
  MessageV0,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

function deserializeInstruction(instruction: {
  programId: string;
  accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: string;
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, "base64"),
  });
}

export async function getAddressLookupTableAccounts(
  connection: Connection,
  keys: string[]
): Promise<AddressLookupTableAccount[]> {
  if (!keys.length) return [];
  const infos = await connection.getMultipleAccountsInfo(
    keys.map((k) => new PublicKey(k))
  );
  return infos.reduce((acc, accountInfo, index) => {
    const address = keys[index];
    if (accountInfo && address) {
      try {
        acc.push(
          new AddressLookupTableAccount({
            key: new PublicKey(address),
            state: AddressLookupTableAccount.deserialize(accountInfo.data),
          })
        );
      } catch (e) {
        console.error("Failed to deserialize ALT", address, e);
      }
    }
    return acc;
  }, [] as AddressLookupTableAccount[]);
}

export async function simulateTransaction(
  connection: Connection,
  transaction: VersionedTransaction,
  addressLookupTableAccounts: AddressLookupTableAccount[]
): Promise<void> {
  const response = await connection.simulateTransaction(transaction, {
    replaceRecentBlockhash: true,
    sigVerify: false,
    accounts: {
      encoding: "base64",
      addresses: addressLookupTableAccounts.map((a) => a.key.toBase58()),
    },
  });
  if (response.value.err) {
    throw new Error(
      `Simulation failed: ${JSON.stringify(response.value.err)}`
    );
  }
}

export async function fetchSwapInstructions(
  request: SwapInstructionsRequest
): Promise<SwapInstructionsResponse> {
  const res = await fetch("https://quote-api.jup.ag/v6/swap-instructions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: request.quoteResponse,
      userPublicKey: request.userPublicKey,
      prioritizationFeeLamports: request.prioritizationFeeLamports,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: request.slippageBps === "auto",
      useSharedAccounts: false,
      feeAccount: request.feeAccount,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export function buildTransactionMessage(
  payerKey: PublicKey,
  recentBlockhash: string,
  swapResponse: SwapInstructionsResponse,
  addressLookupTableAccounts: AddressLookupTableAccount[] = [],
  additionalInstructions: TransactionInstruction[] = []
): MessageV0 {
  const swap = swapResponse as {
    computeBudgetInstructions?: unknown[];
    setupInstructions?: unknown[];
    tokenLedgerInstruction?: unknown;
    swapInstruction: unknown;
    cleanupInstruction?: unknown;
  };
  return new TransactionMessage({
    payerKey,
    recentBlockhash,
    instructions: [
      ...(swap.computeBudgetInstructions || []).map((i) =>
        deserializeInstruction(i as Parameters<typeof deserializeInstruction>[0])
      ),
      ...additionalInstructions,
      ...(swap.setupInstructions || []).map((i) =>
        deserializeInstruction(i as Parameters<typeof deserializeInstruction>[0])
      ),
      ...(swap.tokenLedgerInstruction
        ? [
            deserializeInstruction(
              swap.tokenLedgerInstruction as Parameters<
                typeof deserializeInstruction
              >[0]
            ),
          ]
        : []),
      deserializeInstruction(
        swap.swapInstruction as Parameters<typeof deserializeInstruction>[0]
      ),
      ...(swap.cleanupInstruction
        ? [
            deserializeInstruction(
              swap.cleanupInstruction as Parameters<
                typeof deserializeInstruction
              >[0]
            ),
          ]
        : []),
    ],
  }).compileToV0Message(addressLookupTableAccounts);
}

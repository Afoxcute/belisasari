import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

/** Get ATA for standard SPL token (Token Program). Returns creation instructions if account does not exist. */
export async function getCreateATAInstructions(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey
): Promise<{
  ata: PublicKey;
  instructions: TransactionInstruction[];
}> {
  const ata = await getAssociatedTokenAddress(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID
  );
  const accountInfo = await connection.getAccountInfo(ata);
  if (accountInfo) {
    return { ata, instructions: [] };
  }
  const instruction = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    owner,
    mint,
    TOKEN_PROGRAM_ID
  );
  return { ata, instructions: [instruction] };
}

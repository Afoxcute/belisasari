export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: { amount: string; feeBps: number };
  priceImpactPct: string;
  routePlan: {
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }[];
  contextSlot: number;
  timeTaken: number;
  swapUsdValue?: string;
}

export interface SwapInstructionsRequest {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  prioritizationFeeLamports?: number;
  feeAccount: string;
  slippageBps: number | 'auto';
}

export interface SwapInstructionsResponse {
  swapInstruction: unknown;
  setupInstructions?: unknown[];
  cleanupInstruction?: unknown;
  computeBudgetInstructions?: unknown[];
  tokenLedgerInstruction?: unknown;
  addressLookupTableAddresses?: string[];
  computeUnitLimit?: number;
  lastValidBlockHeight?: number;
  prioritizationFeeLamports?: number;
}

export interface SwapRouteResponse {
  transaction: string;
  lastValidBlockHeight?: number;
  computeUnitLimit?: number;
  prioritizationFeeLamports?: number;
}

export interface ITokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface ITokenSearchResult extends ITokenInfo {
  price?: number | null;
  volume_24h_usd?: number;
  verified?: boolean;
  market_cap?: number;
}

export enum ESwapMode {
  EXACT_IN = 'ExactIn',
  EXACT_OUT = 'ExactOut',
}

/** Jupiter Ultra Swap API - GET /ultra/v1/order response */
export interface UltraOrderResponse {
  mode: string;
  requestId: string;
  transaction?: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct?: string;
  priceImpact?: number;
  routePlan?: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
    bps?: number;
  }>;
  feeMint?: string;
  feeBps?: number;
  taker?: string;
  gasless?: boolean;
  signatureFeeLamports?: number;
  prioritizationFeeLamports?: number;
  rentFeeLamports?: number;
  swapType?: string;
  router?: string;
  inUsdValue?: number;
  outUsdValue?: number;
  swapUsdValue?: number;
  totalTime?: number;
  error?: string;
  errorCode?: number;
  errorMessage?: string;
}

/** Jupiter Ultra Swap API - GET /ultra/v1/search item (MintInformation) */
export interface UltraMintInfo {
  id: string;
  name?: string;
  symbol?: string;
  icon?: string | null;
  decimals?: number;
  usdPrice?: number | null;
  mcap?: number | null;
  isVerified?: boolean | null;
  [key: string]: unknown;
}

/** Jupiter Tokens V2 API - list item (MintInformation) */
export interface JupiterTokenV2 {
  id: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  icon?: string | null;
  usdPrice?: number | null;
  mcap?: number | null;
  isVerified?: boolean | null;
  tags?: string[] | null;
  [key: string]: unknown;
}

/** Jupiter Ultra Swap API - POST /ultra/v1/execute response */
export interface UltraExecuteResponse {
  status: 'Success' | 'Failed';
  signature?: string;
  slot?: string;
  code?: number;
  error?: string;
  inputAmountResult?: string;
  outputAmountResult?: string;
  swapEvents?: Array<{
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
  }>;
}

/**
 * Zerion API types and base URL.
 * API key is used server-side only (env ZERION_API_KEY).
 * @see https://developers.zerion.io/
 */

export const ZERION_API_BASE = "https://api.zerion.io";

export interface ZerionPortfolioTotal {
  positions: number;
}

export interface ZerionPortfolioChanges {
  absolute_1d: number;
  percent_1d: number;
}

export interface ZerionPositionsDistributionByType {
  wallet: number;
  deposited: number;
  borrowed: number;
  locked: number;
  staked: number;
}

export interface ZerionPortfolioAttributes {
  positions_distribution_by_type?: ZerionPositionsDistributionByType;
  positions_distribution_by_chain?: Record<string, number>;
  total?: ZerionPortfolioTotal;
  changes?: ZerionPortfolioChanges;
}

export interface ZerionPortfolioData {
  type: "portfolio";
  id: string;
  attributes: ZerionPortfolioAttributes;
}

export interface ZerionPortfolioResponse {
  links: { self: string };
  data: ZerionPortfolioData;
}

/** Chart point: [timestamp_seconds, balance_in_currency] */
export type ZerionChartPoint = [number, number];

export interface ZerionChartAttributes {
  begin_at: string;
  end_at: string;
  points?: ZerionChartPoint[];
}

export interface ZerionChartData {
  type: "wallet_chart";
  id: string;
  attributes: ZerionChartAttributes;
}

export interface ZerionChartResponse {
  links?: { self?: string };
  data: ZerionChartData;
}

export interface ZerionPositionAttributes {
  fungible_info?: {
    name?: string;
    symbol?: string;
    description?: string;
    icon?: { url?: string };
  };
  quantity?: { numeric: string };
  value?: number;
  price?: number;
  chain?: string;
  protocol?: string;
  position_type?: string;
}

export interface ZerionPosition {
  type: string;
  id: string;
  attributes: ZerionPositionAttributes;
  relationships?: Record<string, unknown>;
}

export interface ZerionPositionsResponse {
  links?: { next?: string };
  data: ZerionPosition[];
}

export interface ZerionTransactionAttributes {
  operation_type?: string;
  hash?: string;
  mined_at?: string;
  sent_quantity?: string;
  sent_asset?: unknown;
  received_quantity?: string;
  received_asset?: unknown;
  fee?: unknown;
  status?: string;
}

export interface ZerionTransaction {
  type: string;
  id: string;
  attributes: ZerionTransactionAttributes;
}

export interface ZerionTransactionsResponse {
  links?: { next?: string };
  data: ZerionTransaction[];
}

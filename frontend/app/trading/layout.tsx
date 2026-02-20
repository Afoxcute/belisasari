import type { ReactNode } from "react";

/** Prevents static prerender of /trading (avoids styled-components/React scope error in Privy deps) */
export const dynamic = "force-dynamic";

export default function TradingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

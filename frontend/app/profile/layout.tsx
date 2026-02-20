import type { ReactNode } from "react";

/** Prevents static prerender of /profile (avoids styled-components/React scope error in deps) */
export const dynamic = "force-dynamic";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

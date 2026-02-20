"use client";

import dynamic from "next/dynamic";

const TradingPageClient = dynamic(() => import("./TradingPageClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-iris-primary/30 border-t-iris-primary rounded-full animate-spin" />
    </div>
  ),
});

export default function TradingPage() {
  return <TradingPageClient />;
}

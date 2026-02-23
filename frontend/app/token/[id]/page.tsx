import Ticker from "@/components/sections/ticker";

// Avoid static prerender so Ticker (client-only providers) does not run during build.
export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { id: string } }) {
  return <Ticker params={params} />;
}

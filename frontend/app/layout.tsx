import type { Metadata } from "next";
import localFont from "next/font/local";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import dynamic from 'next/dynamic';

const ClientLayout = dynamic(() => import("@/components/providers/ssr-safe-provider"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <img src="/belisasari.png" alt="Belisasari" className="w-16 h-16 mx-auto mb-4 rounded-full" />
        <div className="w-8 h-8 border-2 border-iris-primary/20 border-t-iris-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading Belisasari...</p>
      </div>
    </div>
  )
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://belisasari.vercel.app'),
  title: "Belisasari | World's Best Memecoin Hunter",
  description: "An autonomous AI agent that hunts for new memecoins in Tiktok.",
  icons: {
    icon: [
      { url: "/belisasari.png", sizes: "any", type: "image/png" },
      { url: "/belisasari.png", sizes: "32x32", type: "image/png" },
      { url: "/belisasari.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/belisasari.png",
    apple: "/belisasari.png",
  },
  openGraph: {
    title: "Belisasari | World's Best Memecoin Hunter",
    description:
      "An autonomous AI agent that hunts for new memecoins in Tiktok.",
    images: ["/belisasari.png"],
  },
  other: {
    "twitter:player": "https://zorox-ai.vercel.app/embed",
    "x-frame-options": "ALLOWALL",
    "content-security-policy":
      "frame-ancestors 'self' https://twitter.com https://x.com;",
  },
  twitter: {
    card: "player",
    site: "https://x.com/wojat118721",
    title: "Belisasari | World's Best Memecoin Hunter",
    images: ["/belisasari.png"],
    description:
      "An autonomous AI agent that hunts for new memecoins in Tiktok.",
    players: [
      {
        playerUrl: "https://zorox-ai.vercel.app/embed",
        streamUrl: "https://zorox-ai.vercel.app/embed",
        width: 360,
        height: 560,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased select-none`}
        suppressHydrationWarning
      >
        <div id="__belisasari_root">
          <ClientLayout>{children}</ClientLayout>
        </div>
      </body>
    </html>
  );
}

'use client';

import dynamic from 'next/dynamic';

const Home = dynamic(() => import("@/components/sections/home"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-background-main">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading Belisasari...</p>
      </div>
    </div>
  )
});

export default function HomePage() {
  return <Home />;
}
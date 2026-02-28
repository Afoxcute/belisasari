"use client";
import { Separator } from "@/components/ui/separator";
import HeroTable from "./hero-table";
import UnlockNow from "@/components/unlock-now";
import { useEnvironmentStore } from "@/components/context";
import TimeSeriesChart from "../ticker/time-series-chart";
import TiktokSection from "./tiktok";
import GraphPreview from "./graph-preview";
import ScraperStatus from "./tiktok/scraper-status";
import TelegramChannelsHome from "./telegram-channels";

export default function Home() {
  const { paid } = useEnvironmentStore((store) => store);
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <p className="meme-title tracking-widest font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-text-main mt-4 sm:mt-6 md:mt-12 lg:mt-16">
          Belisasari — The Ultimate TikTok & Telegram Memecoin Hunter
        </p>
        <p className="meme-subtitle text-text-secondary font-semibold mt-2 sm:mt-4 text-center text-xs sm:text-sm md:text-base lg:text-lg max-w-4xl mx-auto">
          Realtime tiktok & telegram analytics for memecoins. <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>Hunt the next moonshot 🚀
        </p>
      </div>
      
      {/* Scraper Status */}
      <div className="mb-8 sm:mb-12 lg:mb-16">
        <ScraperStatus />
      </div>
      
      {/* Telegram Channels */}
      <div className="mb-8 sm:mb-12 lg:mb-16">
        <TelegramChannelsHome />
      </div>
      
      {/* Hero Table */}
      <div className="mb-8 sm:mb-12 lg:mb-16">
        <HeroTable />
      </div>
      
      {!paid && (
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <UnlockNow text="View the realtime dashboard" />
        </div>
      )}
      
      {/* TikTok Section */}
      <div className="mb-8 sm:mb-12 lg:mb-16">
        <TiktokSection />
      </div>
      
      {/* Graph Preview */}
      <div className="mb-8 sm:mb-12 lg:mb-16">
        <GraphPreview />
      </div>
      
      <Separator className="my-8 sm:my-12 lg:my-16" />
      
      {!paid && (
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <UnlockNow text="Unlock All Belisasari features now" />
        </div>
      )}
      
      <div className="my-8 sm:my-12 lg:my-16" />
    </div>
  );
}

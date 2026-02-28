import Image from "next/image";
import UnlockNow from "@/components/unlock-now";
import { useEnvironmentStore } from "@/components/context";
import { formatMarketcap, getTimeAgo } from "@/lib/utils";
import { Play, Video } from "lucide-react";

export default function Tiktoks({
  symbol,
  tiktoks,
}: {
  symbol: string;
  tiktoks: any[];
}) {
  const { paid } = useEnvironmentStore((store) => store);
  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex flex-col w-full text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-text-main flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#FF0050]/10 text-[#FF0050]">
              <Video className="w-5 h-5" />
            </span>
            Curated TikToks
          </h2>
          <p className="text-[14px] text-[#6B7280] font-medium">
            Discover what people are saying about <span className="text-[#00D4FF]">${symbol.toUpperCase()}</span>
          </p>
        </div>
      </div>

      <div className="relative flex justify-center w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full place-items-center md:place-items-start">
          {[...(tiktoks || [])]
            .sort((a, b) => {
              const dateA = (a.tiktoks?.created_at ?? a.created_at) ? new Date(a.tiktoks?.created_at ?? a.created_at).getTime() : 0;
              const dateB = (b.tiktoks?.created_at ?? b.created_at) ? new Date(b.tiktoks?.created_at ?? b.created_at).getTime() : 0;
              return dateB - dateA;
            })
            .filter(video => {
              const v = video.tiktoks ?? video;
              return (v.views > 0 || v.comments > 0);
            })
            .slice(0, paid ? (tiktoks?.length ?? 0) : 4)
            .map((video, i) => {
            const v = video.tiktoks ?? video;
            return (
              <div
                onClick={() => window.open(v.url, "_blank")}
                className="cursor-pointer relative w-full max-w-[300px] aspect-[9/16] rounded-2xl border border-border-light hover:border-[#FF0050]/50 shadow-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
                key={i}
              >
                {/* Fallback bg color while loading */}
                <div className="absolute inset-0 bg-[#1A1A24] -z-10 animate-pulse"></div>
                <img
                  src={v.thumbnail}
                  alt="tiktok"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/tiktok-placeholder.png";
                  }}
                />
                
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/20 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F]/60 via-transparent to-transparent"></div>
                
                {/* Top User Info */}
                <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={"https://picsum.photos/300/50" + i}
                      alt={v.username}
                      className="w-10 h-10 rounded-full border-2 border-border-light shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-token.png";
                      }}
                    />
                  </div>
                  <div className="flex flex-col drop-shadow-md">
                    <p className="font-bold text-[14px] text-text-main tracking-tight drop-shadow-lg">
                      {v.username == "" ? "the.chill.guy" : v.username}
                    </p>
                    <p className="text-[11px] text-text-main/80 font-medium drop-shadow-lg">
                      {getTimeAgo(v.created_at)}
                    </p>
                  </div>
                </div>

                {/* Bottom View Count */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="flex-1" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/10 backdrop-blur-md border border-border-light rounded-full">
                    <Play className="w-3.5 h-3.5 text-text-main fill-current" />
                    <p className="text-[13px] font-bold text-text-main tracking-wide">
                      {formatMarketcap(v.views)}
                    </p>
                  </div>
                </div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 bg-foreground/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <Play className="w-6 h-6 text-text-main ml-1 fill-current" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!paid && (
          <>
            {/* Dark overlay for gating content */}
            <div className="absolute top-0 w-full h-full bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/80 to-transparent z-10 pointer-events-none rounded-2xl" />
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-card-bg border border-border-light p-6 rounded-2xl shadow-2xl shrink-0">
                <UnlockNow text="View all curated TikToks" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

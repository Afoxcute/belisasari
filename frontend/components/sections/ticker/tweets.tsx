import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TokenData, Tweet } from "@/lib/types";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Twitter } from "lucide-react";

export default function Tweets({
  tweets,
  symbol,
  growth,
}: {
  tweets: Tweet[];
  symbol: string;
  growth: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const scrollContainer = scrollContainerRef.current;
    let scrollInterval: NodeJS.Timeout;
    let isAtEnd = false;

    const startScrolling = () => {
      scrollInterval = setInterval(() => {
        if (scrollContainer) {
          if (!isAtEnd) {
            scrollContainer.scrollLeft += 1;
            if (
              scrollContainer.scrollLeft + scrollContainer.clientWidth >=
              scrollContainer.scrollWidth
            ) {
              isAtEnd = true;
            }
          } else {
            scrollContainer.scrollLeft -= 1;
            if (scrollContainer.scrollLeft <= 0) {
              isAtEnd = false;
            }
          }
        }
      }, 30);
    };

    const stopScrolling = () => {
      clearInterval(scrollInterval);
    };

    if (scrollContainer) {
      startScrolling();

      const container = scrollContainer;
      container.onmouseenter = stopScrolling;
      container.onmouseleave = startScrolling;
    }

    return () => {
      stopScrolling();
      if (scrollContainer) {
        scrollContainer.onmouseenter = null;
        scrollContainer.onmouseleave = null;
      }
    };
  }, [isClient]);
  
  function timeAgo(timestamp: string): string {
    const now = new Date();
    const timeDifferenceInSeconds = Math.floor(
      (now.getTime() - new Date(timestamp).getTime()) / 1000
    );

    const timeDifferenceInMinutes = Math.floor(timeDifferenceInSeconds / 60);
    const timeDifferenceInHours = Math.floor(timeDifferenceInMinutes / 60);
    const timeDifferenceInDays = Math.floor(timeDifferenceInHours / 24);

    if (timeDifferenceInSeconds < 60) {
      return `${timeDifferenceInSeconds}s ago`;
    } else if (timeDifferenceInMinutes < 60) {
      return `${timeDifferenceInMinutes}m ago`;
    } else if (timeDifferenceInHours < 24) {
      return `${timeDifferenceInHours}h ago`;
    } else if (timeDifferenceInDays < 7) {
      return `${timeDifferenceInDays}d ago`;
    } else {
      return `${Math.floor(timeDifferenceInDays / 7)}wk ago`;
    }
  }

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex flex-col w-full md:w-auto text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-text-main flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
              <Twitter className="w-5 h-5 fill-current" />
            </span>
            Belisasari Highlights
          </h2>
          <p className="text-[14px] text-[#6B7280] font-medium">
            Curated updates for <span className="text-[#00D4FF]">${symbol.toUpperCase()}</span>
          </p>
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card-bg border border-border-light rounded-xl justify-center">
          <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"></span>
          <p className="font-semibold text-[13px] text-text-main tracking-wide uppercase">
            {growth != "0" ? (
              <>
                <span className="text-[#00FF88] text-[15px]">{growth}x</span> growth since start
              </>
            ) : (
              <span className="text-[#6B7280]">No growth tracking yet</span>
            )}
          </p>
        </div>
      </div>

      {tweets.length > 0 ? (
        <ScrollArea className="w-full">
          <div
            ref={scrollContainerRef}
            className="flex space-x-4 pb-4 overflow-x-hidden"
          >
            {tweets.map((tweet, index) => (
              <Card
                key={index}
                className="shrink-0 w-[320px] bg-card-bg border border-border-light hover:border-[#00D4FF]/40 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={() => {
                  window.open(
                    "https://x.com/belisasari/status/1867331863993627085",
                    "_blank"
                  );
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          src={"/belisasari.png"}
                          width={40}
                          height={40}
                          alt="Belisasari Logo"
                          className="rounded-full border-2 border-[#1A1A24]"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-[#1A1A24] rounded-full p-0.5">
                          <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-text-main">✓</div>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[15px] font-bold text-text-main leading-tight group-hover:text-[#00D4FF] transition-colors">
                          Belisasari
                        </p>
                        <p className="text-[13px] text-[#6B7280]">
                          @belisasari
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full bg-foreground/5 border border-border-light">
                      <Twitter className="w-3 h-3 text-[rgba(29,161,242,1)] fill-current" />
                      <p className="text-[11px] font-medium text-[#6B7280]">
                        {timeAgo(tweet.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-[15px] text-text-main/90 leading-relaxed font-medium">
                    {tweet.tweet}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      ) : (
        <div className="w-full py-16 flex flex-col justify-center items-center bg-card-bg border border-border-light border-dashed rounded-2xl">
          <Twitter className="w-8 h-8 text-[#6B7280]/30 mb-3" />
          <p className="text-[14px] text-[#6B7280] font-medium">No recent updates found.</p>
        </div>
      )}
    </div>
  );
}

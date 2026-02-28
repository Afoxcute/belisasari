"use client";
import { useEffect, useState } from "react";
import Tiktoks from "./tiktoks";
import TimeSeriesChart from "./time-series-chart";
import Tweets from "./tweets";
import { TokenData } from "@/lib/types";
import Image from "next/image";
import { useEnvironmentStore } from "@/components/context";
import { IPFS_GATEWAY_URL } from "@/lib/constants";
import { SOL_MINT } from "@/lib/trading-constants";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

const BIRDEYE_WIDGET_BASE = "https://birdeye.so/tv-widget";

export default function Ticker({ params }: { params: { id: string } }) {
  const [coinData, setCoinData] = useState<TokenData | null>(null);
  const { setToken, tokens } = useEnvironmentStore((store) => store);
  const [imageFetched, setImageFetched] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const fetchCoinDataAndPrices = async () => {
      if (isUpdatingPrice) return;

      try {
        const cachedToken = tokens[params.id];
        if (cachedToken) {
          setCoinData(cachedToken);

          const pricesResponse = await fetch(
            `/api/supabase/get-prices?tokenId=${params.id}`
          );
          const pricesData = await pricesResponse.json();

          setCoinData((prev) =>
            prev
              ? {
                  ...prev,
                  prices: pricesData.data,
                }
              : null
          );
          setToken(parseInt(params.id), {
            ...cachedToken,
            prices: pricesData.data,
          });
        } else {
          const coinResponse = await fetch(
            `/api/supabase/get-coin-data?tokenId=${params.id}`
          );
          const coinData = await coinResponse.json();
          setCoinData(coinData);
          setToken(parseInt(params.id), coinData);
        }

        setIsUpdatingPrice(true);

        const updateResponse = await fetch(`/api/supabase/update-price`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenId: params.id }),
        });
        const updateData = await updateResponse.json();

        if (updateData.success) {
          setCoinData((prev) =>
            prev
              ? {
                  ...prev,
                  prices: [...prev.prices, ...updateData.data].sort(
                    (a, b) =>
                      new Date(a.trade_at).getTime() -
                      new Date(b.trade_at).getTime()
                  ),
                }
              : null
          );

          if (coinData) {
            setToken(parseInt(params.id), {
              ...coinData,
              prices: updateData.data || [],
            });
          }
        }
      } catch (error) {
        console.error("Error fetching coin data:", error);
      } finally {
        setIsUpdatingPrice(false);
      }
    };

    fetchCoinDataAndPrices();
  }, [isClient, params.id, coinData, setToken, tokens, isUpdatingPrice]);

  useEffect(() => {
    if (!isClient) return;
    
    const fetchImage = async () => {
      if (!coinData?.uri || imageFetched) return;

      try {
        const metadataResponse = await fetch(
          `${IPFS_GATEWAY_URL}${coinData.uri.split("/").at(-1) || ""}`
        );
        const metadata = await metadataResponse.json();

        setCoinData((prev) =>
          prev
            ? {
                ...prev,
                image: metadata.image,
              }
            : null
        );
        setImageFetched(true);
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    };

    fetchImage();
  }, [isClient, coinData?.uri, imageFetched]);

  if (coinData === null) {
    return (
      <div className="min-h-screen bg-background-main flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading token data...</p>
        </div>
      </div>
    );
  }

  const showBirdeye =
    coinData?.address &&
    coinData.address !== SOL_MINT &&
    coinData.address.length >= 32;
  const birdeyeSrc = showBirdeye
    ? `${BIRDEYE_WIDGET_BASE}/${coinData.address}/${SOL_MINT}?chain=solana&theme=dark&chartType=Candle&chartInterval=1D&chartLeftToolbar=show&viewMode=base%2Fquote`
    : "";

  return (
    <div className="min-h-screen bg-background-main text-text-main">
      <div className="w-full xl:max-w-[1250px] mx-auto pt-8 pb-16 px-4 space-y-8">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-[#6B7280] hover:text-text-main flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <span className="text-[#6B7280]">/</span>
          <span className="text-[#00D4FF] font-medium tracking-tight">
            ${coinData.symbol.toUpperCase()}
          </span>
        </div>

        {showBirdeye && (
          <div className="rounded-2xl border border-border-light bg-card-bg overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-border-light bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-text-main tracking-tight">${coinData.symbol} / SOL</span>
              </div>
              <span className="text-[12px] text-[#6B7280] font-medium tracking-wide uppercase">Chart by Birdeye</span>
            </div>
            <iframe
              title={`${coinData.symbol} price chart`}
              src={birdeyeSrc}
              className="w-full h-[500px] border-0"
              allowFullScreen
            />
          </div>
        )}
        
        <TimeSeriesChart tokenData={coinData} />
        
        <Tweets
          symbol={coinData.symbol}
          tweets={coinData.tweets}
          growth={
            coinData.tweets ? (coinData.tweets.length > 0 ? "1.5" : "0") : "0"
          }
        />
        
        <Tiktoks symbol={coinData.symbol} tiktoks={coinData.tiktoks} />
      </div>
    </div>
  );
}

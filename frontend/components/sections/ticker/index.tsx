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
    // Mark that we're on the client side
    setIsClient(true);
  }, []);

  // First useEffect for fetching initial coin data
  useEffect(() => {
    // Only fetch data after we're on the client side
    if (!isClient) return;
    
    const fetchCoinDataAndPrices = async () => {
      if (isUpdatingPrice) return; // Prevent concurrent updates

      try {
        // Use cached data if available
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

        // Set flag before updating price
        setIsUpdatingPrice(true);

        // Initiate long-running update-price API call
        const updateResponse = await fetch(`/api/supabase/update-price`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenId: params.id }),
        });
        const updateData = await updateResponse.json();

        // Update prices after `update-price` completes
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
  }, [isClient, params.id, coinData, setToken, tokens, isUpdatingPrice]); // Add missing dependencies

  // Second useEffect for fetching image
  useEffect(() => {
    // Only fetch image after we're on the client side
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
  }, [isClient, coinData?.uri, imageFetched]); // Add isClient to dependencies

  if (coinData === null) {
    return (
      <div className="w-full xl:w-[1250px] mx-auto mt-12 px-4">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-yellow-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";
  const showBirdeye =
    coinData?.address &&
    coinData.address !== SOL_MINT &&
    coinData.address.length >= 32;
  const birdeyeSrc = showBirdeye
    ? `${BIRDEYE_WIDGET_BASE}/${coinData.address}/${SOL_MINT}?chain=solana&theme=${theme}&chartType=Candle&chartInterval=1D&chartLeftToolbar=show&viewMode=base%2Fquote`
    : "";

  return (
    <div className="w-full xl:w-[1250px] mx-auto mt-12 px-4">
      {showBirdeye && (
        <div className="mb-8 rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
            {coinData.symbol} / SOL — Chart by Birdeye
          </div>
          <iframe
            title={`${coinData.symbol} price chart`}
            src={birdeyeSrc}
            className="w-full h-[480px] border-0"
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
  );
}

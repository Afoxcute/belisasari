import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  TooltipProps,
} from "recharts";
import ClientOnly from "@/components/ui/client-only";
import {
  ArrowUpRightFromSquare,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useEnvironmentStore } from "@/components/context";
import UnlockNow from "@/components/unlock-now";
import { TimeframeType, DataPoint, TokenData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  formatDateTime,
  formatFloatingNumber,
  processTradeData,
} from "@/lib/utils";

function ChartContent({
  data,
  showPrice,
  showPopularity,
  timeframe,
  startingPrice,
  isPriceUp,
}: {
  data: DataPoint[];
  showPrice: boolean;
  showPopularity: boolean;
  timeframe: TimeframeType;
  startingPrice: number;
  isPriceUp: boolean;
}) {
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
    
    // Set initial window width
    setWindowWidth(window.innerWidth);
    
    // Add resize listener
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate values that will be used in useMemo hooks
  const maxPrice = Math.max(...data.map((d) => d.price));
  const minPrice = Math.min(...data.map((d) => d.price));
  const priceMargin = (maxPrice - minPrice) * 1.5;

  // Get domain for X axis
  const xDomain = useMemo(() => {
    if (data.length === 0) return [0, 0];
    return [
      Math.min(...data.map((d) => d.rawTimestamp)),
      Math.max(...data.map((d) => d.rawTimestamp)),
    ];
  }, [data]);

  // Don't render chart until we're on the client side
  if (!isClient) {
    return (
      <CardContent className="p-0 sm:p-6 bg-card-bg">
        <div className="h-[300px] sm:h-[400px] w-full flex items-center justify-center">
          <p className="text-[#6B7280]">Loading chart...</p>
        </div>
      </CardContent>
    );
  }

  const getTickCount = (): number => {
    return 7;
  };

  return (
    <CardContent className="p-0 sm:p-6">
      <div className="h-[300px] sm:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: windowWidth < 768 ? 10 : 20,
              left: windowWidth < 768 ? 10 : 20,
              bottom: 5,
            }}
          >
            <ReferenceLine
              y={startingPrice}
              yAxisId="price"
              stroke="#9CA3AF"
              strokeDasharray="3 3"
              label={{
                value: `$${startingPrice.toFixed(2)}`,
                position: "center",
                fill: "#6B7280",
                fontSize: 12,
              }}
            />
            <CartesianGrid
              horizontal={true}
              vertical={false}
              strokeDasharray="3 3"
              stroke="#374151"
            />
             <XAxis
              dataKey="rawTimestamp"
              type="number"
              domain={xDomain}
              scale="time"
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);
                const hours = date.getHours();
                const minutes = date.getMinutes();
                return `${String(hours).padStart(2, "0")}:${String(
                  minutes
                ).padStart(2, "0")}`;
              }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tick={{
                fill: "#6B7280",
                fontSize: windowWidth < 768 ? 10 : 12,
              }}
              interval={Math.floor(data.length / getTickCount())}
            />
            <YAxis
              yAxisId="price"
              orientation="left"
              domain={[minPrice - priceMargin * 0.1, maxPrice]}
              width={windowWidth < 768 ? 40 : 50}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tick={{
                fill: "#6B7280",
                fontSize: windowWidth < 768 ? 10 : 12,
              }}
              tickFormatter={(value) => formatFloatingNumber(value)}
            />
            <YAxis
              yAxisId="secondary"
              orientation="right"
              domain={[0, "auto"]}
              width={windowWidth < 768 ? 40 : 50}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tick={{
                fill: "#6B7280",
                fontSize: windowWidth < 768 ? 10 : 12,
              }}
            />

            {showPrice && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke={isPriceUp ? "#10B981" : "#EF4444"}
                strokeWidth={2}
                dot={false}
                name="Price"
                connectNulls={true}
              />
            )}

            {showPopularity && (
              <Line
                yAxisId="secondary"
                type="monotone"
                dataKey="popularity"
                stroke="#800080"
                strokeWidth={2}
                dot={false}
                name="Popularity"
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="border border-border-light bg-[#1A1A24] rounded-xl shadow-xl p-3 text-text-main">
                      <p className="font-bold text-[13px] mb-2">{formatDateTime(label)}</p>
                      {payload.map((entry, index) => (
                        <p key={index} className="m-0 text-[12px] flex items-center justify-between gap-4">
                          <span className="text-[#6B7280]">{entry.name}</span>
                          <span className="font-bold">
                            {entry.name === "Price" ? "$" : ""}
                            {formatFloatingNumber(entry.value as number)}
                          </span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
              cursor={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  );
}
const PaywallOverlay = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Blur overlay for the chart */}
      <div
        className="absolute inset-0 w-full h-full backdrop-blur-md bg-black/40 rounded-lg"
        style={{ backdropFilter: "blur(8px)" }} // Added explicit blur
      />

      {/* Centered paywall card */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <UnlockNow text="Unlock the complete graph" />
      </div>
    </div>
  );
};
export default function TimeSeriesChartWithPaywall({
  tokenData,
}: {
  tokenData: TokenData;
}) {
  // All React hooks must be called before any early returns
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showPopularity, setShowPopularity] = useState<boolean>(true);
  const [usdOrSolToggle, setUsdOrSolToggle] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<TimeframeType>("24h");
  const { paid } = useEnvironmentStore((store) => store);

  // All useMemo hooks must also be called before any early returns
  const data = useMemo(
    () => {
      // Safety check: ensure prices data exists before processing
      if (!tokenData.prices || !Array.isArray(tokenData.prices) || tokenData.prices.length === 0) {
        console.warn('TimeSeriesChart: No prices data available for', tokenData.symbol);
        return [];
      }
      
      // Safety check for tiktoks data
      const startMentions = tokenData.tiktoks && Array.isArray(tokenData.tiktoks) && tokenData.tiktoks.length > 1
        ? tokenData.tiktoks[0].count || 0
        : 0;
      
      const endMentions = tokenData.tiktoks && Array.isArray(tokenData.tiktoks) && tokenData.tiktoks.length > 2
        ? tokenData.tiktoks[tokenData.tiktoks.length - 1].count || 0
        : tokenData.tiktoks && Array.isArray(tokenData.tiktoks) && tokenData.tiktoks.length > 1
        ? tokenData.tiktoks[0].count || 0
        : 0;
      
      return processTradeData(
        tokenData.prices,
        startMentions,
        endMentions,
        tokenData.views || 0,
        timeframe
      );
    },
    [tokenData.prices, tokenData.tiktoks, tokenData.views, timeframe]
  );

  const startingPrice = useMemo(() => data[0]?.price || 0, [data]);
  const priceChange = useMemo(() => {
    if (data.length < 2) return "0.000";
    return (
      ((data[data.length - 1].price - data[0].price) / data[0].price) *
      100
    ).toFixed(3);
  }, [data]);
  const isPriceUp = useMemo(() => {
    if (data.length < 2) return true;
    return data[data.length - 1].price > data[0].price;
  }, [data]);

  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    setTimeframe(newTimeframe);
  };

  // Add safety check for tokenData
  if (!tokenData || !tokenData.symbol) {
    return (
      <Card className="w-full max-w-[100vw] overflow-hidden sen">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-text-secondary">Loading token data...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Additional safety check for data processing
  if (!data || data.length === 0) {
    return (
      <Card className="w-full max-w-[100vw] overflow-hidden sen">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-text-secondary">No chart data available</p>
            <p className="text-xs text-text-secondary">
              {tokenData.symbol ? `No price data for ${tokenData.symbol}` : 'Token data is incomplete'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Final safety check before rendering
  if (!tokenData.symbol || !tokenData.prices || !Array.isArray(tokenData.prices) || tokenData.prices.length === 0) {
  return (
      <Card className="w-full max-w-[100vw] overflow-hidden sen">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-text-secondary">Incomplete token data</p>
            <p className="text-xs text-text-secondary">
              Missing required information to display chart
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ClientOnly fallback={
      <Card className="w-full max-w-[100vw] overflow-hidden sen">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-text-secondary">Loading chart...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    }>
    <Card className="w-full max-w-[100vw] overflow-hidden bg-card-bg border border-border-light rounded-2xl shadow-xl mt-8">
      <CardHeader className="space-y-4 p-4 sm:p-6 border-b border-border-light">
        {/* Token Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <img
              src={tokenData.image || '/placeholder-token.png'}
              alt={`${tokenData.symbol || 'Token'} token icon`}
              className="rounded-full mr-2 w-6 h-6 sm:w-8 sm:h-8"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-token.png';
              }}
            />
            <CardTitle className="text-lg sm:text-2xl font-bold text-text-main tracking-tight flex items-center gap-2">
              {tokenData.symbol.toLocaleUpperCase()}
              <span
                className="text-[#6B7280] text-sm font-medium cursor-pointer hover:text-text-main transition-colors uppercase tracking-wider bg-foreground/5 px-2 py-0.5 rounded-md"
                onClick={() => {
                  setUsdOrSolToggle(!usdOrSolToggle);
                }}
              >
                /{usdOrSolToggle ? "USD" : "SOL"}
              </span>
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {tokenData.address && (
            <Button
              variant="ghost"
              className="hidden sm:flex hover:bg-foreground/5 text-[#6B7280] hover:text-text-main font-mono text-[13px]"
              onClick={() =>
                window.open(
                  `https://solscan.io/token/${tokenData.address}`,
                  "_blank"
                )
              }
            >
              {tokenData.address.slice(0, 4)}...{tokenData.address.slice(-4)}
              <ArrowUpRightFromSquare className="w-3 h-3 ml-2 text-[#00D4FF]" />
            </Button>
            )}
            <Select value={timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>

              {/* Full names for larger screens */}
              <SelectContent>
                <SelectItem value="30m">30 Minutes</SelectItem>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="3h">3 Hours</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Display */}
        <div className="flex items-end flex-wrap gap-3">
          <p className="font-bold text-3xl sm:text-5xl text-text-main tracking-tight">
            ${usdOrSolToggle
              ? (tokenData.latest_price_usd || 0).toFixed(6)
              : (tokenData.latest_price_sol || 0).toFixed(6)}
          </p>
          {isPriceUp ? (
            <span className="flex items-center text-green-500 text-sm sm:text-md">
              <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="ml-1">+{priceChange}%</span>
            </span>
          ) : (
            <span className="flex items-center text-red-500 text-sm sm:text-md">
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="ml-1">{priceChange}%</span>
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
          <div className="flex items-center space-x-3 bg-foreground/5 p-3 rounded-xl border border-border-light">
            <Switch
              checked={showPrice}
              onCheckedChange={setShowPrice}
              id="price-toggle"
              className="data-[state=checked]:bg-[#00D4FF]"
            />
            <div
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                isPriceUp ? "bg-[#10B981]" : "bg-[#EF4444]"
              }`}
            />
            <Label
              htmlFor="price-toggle"
              className="text-[13px] text-text-main font-medium"
            >
              Price Trajectory
            </Label>
          </div>

          <div className="flex items-center space-x-3 bg-foreground/5 p-3 rounded-xl border border-border-light">
            <Switch
              checked={showPopularity}
              onCheckedChange={setShowPopularity}
              id="views-toggle"
              className="data-[state=checked]:bg-[#A855F7]"
            />
            <div className="w-3 h-3 rounded-full bg-[#A855F7]" />
            <Label
              htmlFor="popularity-toggle"
              className="text-[13px] text-text-main font-medium"
            >
              Social Virality
            </Label>
            <TooltipProvider>
              <TooltipUI delayDuration={100}>
                <TooltipTrigger>
                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                </TooltipTrigger>
                <TooltipContent className="text-center">
                  Popularity is calculated using views and <br />
                  mentions of the tickers in the video and <br />
                  comments.
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <div className="relative">
        <ClientOnly>
        <ChartContent
          data={data}
          showPrice={showPrice}
          showPopularity={showPopularity}
          timeframe={timeframe}
          startingPrice={startingPrice}
          isPriceUp={isPriceUp}
        />
        </ClientOnly>
        {!paid && <UnlockNow text="Unlock the complete graph" />}
      </div>
    </Card>
    </ClientOnly>
  );
}

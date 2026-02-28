"use client";

import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useHeliusNfts } from "@/hooks/use-helius-nfts";
import { useAppAuth } from "@/components/provider/PrivyAppAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImageIcon,
  Layers,
  RefreshCw,
  Loader2,
  History,
  ExternalLink,
  Wallet,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useTwitterPost } from "@/hooks/use-twitter-post";
import { useOpenAIInsight } from "@/hooks/use-openai-insight";
import type { HeliusDASAsset, HeliusEnhancedTransaction } from "@/lib/helius";

function formatDate(ts?: number): string {
  if (ts == null) return "—";
  try {
    return new Date(ts * 1000).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function imageUrl(asset: HeliusDASAsset): string | null {
  const cdn = asset.content?.files?.[0]?.cdn_uri;
  const uri = asset.content?.files?.[0]?.uri ?? asset.content?.json_uri;
  return cdn || uri || null;
}

function collectionKey(asset: HeliusDASAsset): string {
  const g = asset.grouping?.find((x) => x.group_key === "collection");
  return g?.group_value ?? "Unknown";
}

export default function NftsPage() {
  const { walletAddress, walletIsConnected } = useCurrentWallet();
  const { ready, authenticated, login } = useAppAuth();
  const { nfts, transactions, total, loading, loadingTx, error, refetch } =
    useHeliusNfts(walletAddress);
  const [selectedNft, setSelectedNft] = useState<HeliusDASAsset | null>(null);
  const { post: postTweet, posting: twitterPosting } = useTwitterPost();
  const { insight: aiInsight, loading: aiLoading, error: aiError, fetchInsight } = useOpenAIInsight();

  const collectionAnalytics = useMemo(() => {
    const byCollection = new Map<string, { count: number; sample?: HeliusDASAsset }>();
    for (const nft of nfts) {
      const key = collectionKey(nft);
      const cur = byCollection.get(key);
      if (!cur) byCollection.set(key, { count: 1, sample: nft });
      else cur.count += 1;
    }
    return Array.from(byCollection.entries())
      .map(([id, data]) => ({ collectionId: id, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [nfts]);

  if (!walletIsConnected) {
    return (
      <div className="min-h-screen bg-background-main pt-12">
        <div className="container mx-auto p-6 max-w-2xl text-center">
          <div className="bg-card-bg border border-border-light rounded-xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="h-6 w-6 text-[#00D4FF]" />
            </div>
            <h1 className="text-[24px] font-bold text-text-main mb-2">NFT Portfolio (Helius)</h1>
            <p className="text-[#6B7280] text-[15px] mb-8">
              Connect your wallet to view your NFT portfolio, collection analytics, metadata, and transaction history.
            </p>
            <Button
              className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0A0F] font-bold px-8 h-11 border-none"
              onClick={() => ready && !authenticated && login({ loginMethods: ["wallet"], walletChainType: "solana-only" })}
            >
              <Image src="/solana.png" width={20} height={20} className="rounded-full mr-2" alt="Solana" />
              Connect wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main py-8 text-text-main">
      <div className="container mx-auto px-6 space-y-8 max-w-[1200px]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-light pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-[2px] h-6 bg-[#00D4FF]"></div>
              <h1 className="text-[24px] font-bold text-text-main tracking-tight flex items-center gap-2">
                NFT Portfolio
              </h1>
            </div>
            <p className="text-[#6B7280] text-[14px]">
              NFT portfolio viewer, collection analytics, metadata, and transaction history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-border-light text-text-main hover:bg-foreground/5 h-9"
              onClick={() =>
                postTweet(
                  "Viewing my NFT collection on Belisasari (Helius). #Belisasari #Solana #NFTs"
                )
              }
              disabled={twitterPosting}
            >
              {twitterPosting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Share to Twitter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-transparent border-border-light text-[#00D4FF] hover:bg-[#00D4FF]/10 hover:text-[#00D4FF] h-9"
              onClick={() => refetch()} 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-xl p-4 flex items-start gap-3">
            <div className="min-w-0">
              <p className="text-[#FF3B3B] text-[14px] font-medium">{error}</p>
              <p className="text-[#FF3B3B]/70 text-[12px] mt-1">
                Use RPC_URL with Helius (e.g. https://mainnet.helius-rpc.com/?api-key=...) for DAS and enhanced APIs.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column (Portfolio) */}
          <div className="lg:col-span-2 space-y-6">
            {/* NFT portfolio viewer */}
            <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              <div className="border-b border-border-light p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-semibold text-text-main flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[#00D4FF]" />
                    Your NFTs
                  </h2>
                  <Badge className="bg-foreground/10 text-text-main hover:bg-foreground/20 border-none">
                    {total != null ? `${total} Assets` : "Loading..."}
                  </Badge>
                </div>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-[#00D4FF]" />
                  </div>
                ) : nfts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="h-8 w-8 text-[#6B7280]" />
                    </div>
                    <p className="text-[#6B7280] text-[15px]">No NFTs found in this wallet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {nfts.map((asset) => {
                      const img = imageUrl(asset);
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          className="group rounded-xl border border-border-light overflow-hidden bg-[#1A1A24] text-left transition-all hover:border-[#00D4FF]/50 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                          onClick={() => setSelectedNft(asset)}
                        >
                          <div className="aspect-square relative bg-foreground/5 overflow-hidden">
                            {img ? (
                              <img
                                src={img}
                                alt=""
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-[#6B7280]" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-[11px] font-mono truncate text-[#6B7280] mb-1">{asset.id.slice(0, 8)}…</p>
                            <p className="text-[14px] font-medium text-text-main truncate">
                              {(asset.content?.metadata as { name?: string })?.name ?? "Unnamed"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Collection analytics */}
            <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              <div className="border-b border-border-light p-5">
                <h2 className="text-[18px] font-semibold text-text-main flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#00D4FF]" />
                  Collection Analytics
                </h2>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00D4FF]" />
                  </div>
                ) : collectionAnalytics.length === 0 ? (
                  <p className="text-[#6B7280] text-[14px] py-6 text-center">No collections data available.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {collectionAnalytics.slice(0, 12).map(({ collectionId, count, sample }) => (
                      <div
                        key={collectionId}
                        className="rounded-lg border border-border-light bg-white/[0.02] p-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="h-10 w-10 rounded overflow-hidden bg-foreground/5 shrink-0 border border-border-light">
                          {sample && imageUrl(sample) ? (
                            <img
                              src={imageUrl(sample)!}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-[#6B7280]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#00D4FF] font-mono truncate mb-0.5" title={collectionId}>
                            {collectionId.slice(0, 8)}…
                          </p>
                          <p className="font-semibold text-text-main text-[13px]">{count} Asset{count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* AI insight (OpenAI) */}
            <div className="bg-card-bg border border-[#A855F7]/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.05)] relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#A855F7]/50 to-transparent"></div>
              <div className="p-5 border-b border-border-light bg-gradient-to-b from-[#A855F7]/5 to-transparent">
                <h2 className="text-[16px] font-semibold text-text-main flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#A855F7]" />
                  AI Insight
                </h2>
                <p className="text-[13px] text-[#6B7280] mt-1">AI-powered summary of your portfolio</p>
              </div>
              <div className="p-5">
                <Button
                  className="w-full bg-[#A855F7]/10 hover:bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30 h-10 mb-4"
                  disabled={aiLoading}
                  onClick={() => {
                    const context = `NFT count: ${nfts.length}. Collections: ${collectionAnalytics.length}. Top collections: ${collectionAnalytics.slice(0, 5).map((c) => `${c.collectionId.slice(0, 8)}… (${c.count} NFTs)`).join("; ")}.`;
                    fetchInsight(
                      context,
                      "Based on this NFT collection snapshot on Solana, give 2-3 short sentences of insight (collecting, diversification, or what to watch). Be concise."
                    );
                  }}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Analysis
                </Button>
                
                {aiError && (
                  <div className="p-3 rounded-lg bg-[#FF3B3B]/10 border border-[#FF3B3B]/20">
                    <p className="text-[#FF3B3B] text-[12px]">{aiError}</p>
                  </div>
                )}
                
                {aiInsight && (
                  <div className="p-4 rounded-lg bg-foreground/5 border border-border-light relative">
                    <div className="absolute -left-px top-4 bottom-4 w-[2px] bg-[#A855F7]"></div>
                    <p className="text-[14px] text-text-main/90 leading-relaxed font-medium">{aiInsight}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction history */}
            <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border-light">
                <h2 className="text-[16px] font-semibold text-text-main flex items-center gap-2">
                  <History className="h-4 w-4 text-[#00D4FF]" />
                  Recent Activity
                </h2>
              </div>
              <div className="p-0">
                {loadingTx ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00D4FF]" />
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-[#6B7280] text-[13px] py-8 text-center px-4">No recent NFT transactions found.</p>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
                    {transactions.map((tx: HeliusEnhancedTransaction) => (
                      <div
                        key={tx.signature}
                        className="py-3 px-5 hover:bg-white/[0.02] transition-colors group flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-text-main capitalize mb-0.5">
                            {tx.type ? String(tx.type).replace(/_/g, " ") : "Transaction"}
                          </p>
                          {tx.description && (
                            <p className="text-[13px] text-[#6B7280] leading-snug line-clamp-2 mb-1">{tx.description}</p>
                          )}
                          <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]/50"></span>
                            {formatDate(tx.timestamp)}
                          </p>
                        </div>
                        <a
                          href={`https://solscan.io/tx/${tx.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-[#6B7280] hover:bg-foreground/10 hover:text-text-main shrink-0 transition-all opacity-50 group-hover:opacity-100"
                          title="View on Solscan"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata display modal */}
        <Dialog open={!!selectedNft} onOpenChange={() => setSelectedNft(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card-bg border-border-light text-text-main p-6 shadow-2xl">
            {selectedNft && (
              <>
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-[20px] font-bold text-text-main">Asset Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="aspect-square rounded-xl overflow-hidden bg-foreground/5 border border-border-light relative">
                    {imageUrl(selectedNft) ? (
                      <img
                        src={imageUrl(selectedNft)!}
                        alt=""
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-[#6B7280]" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[12px] uppercase tracking-wider text-[#6B7280] font-semibold mb-1">Name</p>
                      <p className="text-[16px] font-bold text-text-main">
                        {(selectedNft.content?.metadata as { name?: string })?.name ?? "Unnamed Asset"}
                      </p>
                    </div>
                    
                    {((selectedNft.content?.metadata as { description?: string })?.description) && (
                      <div>
                        <p className="text-[12px] uppercase tracking-wider text-[#6B7280] font-semibold mb-1">Description</p>
                        <p className="text-[14px] text-text-main/80 leading-relaxed bg-foreground/5 p-3 rounded-lg border border-border-light">
                          {(selectedNft.content?.metadata as { description?: string })?.description}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[12px] uppercase tracking-wider text-[#6B7280] font-semibold mb-1">Mint ID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-[13px] text-[#00D4FF] truncate" title={selectedNft.id}>
                            {selectedNft.id.slice(0, 12)}…
                          </p>
                          <a
                            href={`https://solscan.io/token/${selectedNft.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#6B7280] hover:text-text-main"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                      
                      {selectedNft.grouping?.some((g) => g.group_key === "collection") && (
                        <div>
                          <p className="text-[12px] uppercase tracking-wider text-[#6B7280] font-semibold mb-1">Collection</p>
                          <p className="font-mono text-[13px] text-text-main truncate" title={selectedNft.grouping.find((g) => g.group_key === "collection")?.group_value}>
                            {selectedNft.grouping.find((g) => g.group_key === "collection")?.group_value?.slice(0, 12)}…
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedNft.creators && selectedNft.creators.length > 0 && (
                      <div>
                        <p className="text-[12px] uppercase tracking-wider text-[#6B7280] font-semibold mb-2">Creators</p>
                        <ul className="space-y-2">
                          {selectedNft.creators.map((c, i) => (
                            <li key={i} className="flex items-center justify-between bg-white/[0.02] border border-border-light p-2 rounded px-3">
                              <span className="font-mono text-[13px] text-text-main/80 truncate mr-3">{c.address.slice(0, 16)}…</span>
                              {c.verified && (
                                <Badge className="bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 border-none text-[10px] px-1.5 py-0">Verified</Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {(selectedNft.content?.metadata as { attributes?: Array<{ trait_type: string; value: string }> })?.attributes?.length ? (
                      <div>
                        <p className="text-[12px] uppercase tracking-wider text-[#6B7280] font-semibold mb-2">Attributes</p>
                        <div className="flex flex-wrap gap-2">
                          {((selectedNft.content?.metadata as { attributes?: Array<{ trait_type: string; value: string }> }).attributes ?? []).map((a, i) => (
                            <div key={i} className="bg-[#1A1A24] border border-border-light rounded-lg px-3 py-1.5 flex flex-col">
                              <span className="text-[10px] text-[#6B7280] uppercase mix-blend-screen">{a.trait_type}</span>
                              <span className="text-[13px] font-semibold text-text-main">{a.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ): null}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

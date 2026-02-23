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
  const { login } = useAppAuth();
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
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-6 w-6" />
              NFT Portfolio (Helius)
            </CardTitle>
            <CardDescription>
              Connect your wallet to view your NFT portfolio, collection analytics, metadata, and transaction history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="bg-iris-primary hover:bg-iris-primary/90"
              onClick={() => login({ loginMethods: ["wallet"], walletChainType: "solana-only" })}
            >
              <Image src="/solana.png" width={20} height={20} className="rounded-full mr-2" alt="Solana" />
              Connect wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-7 w-7" />
            NFTs (Helius)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            NFT portfolio viewer, collection analytics, metadata, and transaction history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              postTweet(
                "Viewing my NFT collection on Belisasari (Helius). #Belisasari #Solana #NFTs"
              )
            }
            disabled={twitterPosting}
          >
            {twitterPosting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Share to Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
            <p className="text-muted-foreground text-xs mt-1">
              Use RPC_URL with Helius (e.g. https://mainnet.helius-rpc.com/?api-key=...) for DAS and enhanced APIs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI insight (OpenAI) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI insight
          </CardTitle>
          <CardDescription>Get a short AI summary of your NFT collection (Helius + OpenAI).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
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
            Get AI insight
          </Button>
          {aiError && <p className="text-destructive text-xs">{aiError}</p>}
          {aiInsight && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiInsight}</p>}
        </CardContent>
      </Card>

      {/* Collection analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Collection analytics
          </CardTitle>
          <CardDescription>NFTs grouped by collection</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : collectionAnalytics.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No collections yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {collectionAnalytics.slice(0, 12).map(({ collectionId, count, sample }) => (
                <div
                  key={collectionId}
                  className="rounded-lg border p-3 flex items-center gap-3 hover:bg-muted/50"
                >
                  <div className="h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
                    {sample && imageUrl(sample) ? (
                      <img
                        src={imageUrl(sample)!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-mono truncate" title={collectionId}>
                      {collectionId.slice(0, 6)}…
                    </p>
                    <p className="font-semibold">{count} NFT{count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFT portfolio viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            NFT portfolio
          </CardTitle>
          <CardDescription>
            {total != null ? `Total: ${total} NFT(s)` : "Your NFTs"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : nfts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No NFTs in this wallet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {nfts.map((asset) => {
                const img = imageUrl(asset);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    className="rounded-lg border overflow-hidden bg-muted/30 hover:bg-muted/60 text-left transition focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setSelectedNft(asset)}
                  >
                    <div className="aspect-square relative bg-muted">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-mono truncate text-muted-foreground">{asset.id.slice(0, 8)}…</p>
                      <p className="text-sm font-medium truncate">
                        {(asset.content?.metadata as { name?: string })?.name ?? "—"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata display modal */}
      <Dialog open={!!selectedNft} onOpenChange={() => setSelectedNft(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedNft && (
            <>
              <DialogHeader>
                <DialogTitle>Metadata</DialogTitle>
                <DialogDescription>NFT details and attributes</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {imageUrl(selectedNft) ? (
                    <img
                      src={imageUrl(selectedNft)!}
                      alt=""
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {(selectedNft.content?.metadata as { name?: string })?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">
                    {(selectedNft.content?.metadata as { description?: string })?.description ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mint (ID)</p>
                  <p className="font-mono text-xs break-all">{selectedNft.id}</p>
                  <a
                    href={`https://solscan.io/token/${selectedNft.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm inline-flex items-center gap-1 mt-1"
                  >
                    View on Solscan <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {selectedNft.grouping && selectedNft.grouping.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Collection</p>
                    <p className="font-mono text-xs break-all">
                      {selectedNft.grouping.find((g) => g.group_key === "collection")?.group_value ?? "—"}
                    </p>
                  </div>
                )}
                {selectedNft.creators && selectedNft.creators.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Creators</p>
                    <ul className="text-xs font-mono space-y-1">
                      {selectedNft.creators.map((c, i) => (
                        <li key={i}>
                          {c.address} {c.verified ? "✓" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(selectedNft.content?.metadata as { attributes?: Array<{ trait_type: string; value: string }> })?.attributes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Attributes</p>
                    <div className="flex flex-wrap gap-2">
                      {((selectedNft.content?.metadata as { attributes?: Array<{ trait_type: string; value: string }> }).attributes ?? []).map((a, i) => (
                        <Badge key={i} variant="secondary">
                          {a.trait_type}: {a.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            NFT transaction history
          </CardTitle>
          <CardDescription>Recent NFT-related activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No NFT transactions found.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {transactions.map((tx: HeliusEnhancedTransaction) => (
                <div
                  key={tx.signature}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium capitalize">
                      {tx.type ? String(tx.type).replace(/_/g, " ") : "Transaction"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </p>
                    {tx.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{tx.description}</p>
                    )}
                  </div>
                  <a
                    href={`https://solscan.io/tx/${tx.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
                    title="View on Solscan"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

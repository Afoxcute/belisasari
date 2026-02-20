"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { Check, ChevronDown, LogOut, User } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEnvironmentStore } from "@/components/context";
import CommandMenu from "./command-menu";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { shortenAddress } from "@/lib/utils";
import fetchBalances from "@/lib/fetchBalances";
import { useToast } from "@/hooks/use-toast";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { CreateProfileContainer } from "@/components/profile/CreateProfileContainer";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { setVisible } = useWalletModal();
  const { disconnect, connected, publicKey } = useWallet();
  const { walletAddress, setAddress, setPaid, setBalances } =
    useEnvironmentStore((store) => store);
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const authDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (authDropdownRef.current && !authDropdownRef.current.contains(e.target as Node)) setAuthOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const { ready, authenticated, logout } = usePrivy();
  const { login } = useLogin();
  const { walletAddress: privyWallet, mainUsername } = useCurrentWallet();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync Privy wallet to store when authenticated
  useEffect(() => {
    if (authenticated && privyWallet) {
      setAddress(privyWallet);
    }
  }, [authenticated, privyWallet, setAddress]);

  useEffect(() => {
    if (!isClient) return;
    const addr = privyWallet || (connected && publicKey ? publicKey.toString() : "") || walletAddress;
    if (addr) {
      fetch(`/api/supabase/get-sub?address=${addr}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.expires && new Date().getTime() <= data.expires) setPaid(true);
        });
      fetchBalances(addr).then((balances) => {
        setBalances(balances.sol.toString(), balances.token.toString());
      });
    }
  }, [walletAddress, privyWallet, connected, publicKey, isClient, setPaid, setBalances]);

  const displayUsername = profileUsername ?? mainUsername;
  const displayWallet = privyWallet || (connected ? publicKey?.toString() ?? "" : "") || walletAddress;

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({ title: "Copied address" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 space-y-4 sm:space-y-0">
        <div
          className="flex items-center space-x-3 sm:space-x-4 select-none cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/belisasari.png"
            alt="Belisasari Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <p className="font-bold text-lg sm:text-2xl crypto-futuristic tracking-widest text-iris-primary">
            Belisasari
          </p>
        </div>

        <CommandMenu />

        <div className="hidden md:flex space-y-4 sm:space-y-0 sm:space-x-4">

          <Button
            variant="ghost"
            className="hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
            onClick={() => router.push("/trending-coins")}
          >
            <p className="sen text-sm sm:text-md font-bold">🚀 Trending Coins</p>
          </Button>

          <Button
            variant="ghost"
            className="hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
            onClick={() => router.push("/feed")}
          >
            <p className="sen text-sm sm:text-md font-bold">Feed</p>
          </Button>

          <Button
            variant="ghost"
            className="hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
            onClick={() => router.push("/trading")}
          >
            <p className="sen text-sm sm:text-md font-bold">Trading (Jupiter)</p>
          </Button>

          <Button
            variant="ghost"
            className="hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
            onClick={() => router.push("/portfolio")}
          >
            <p className="sen text-sm sm:text-md font-bold">Portfolio</p>
          </Button>

          <Button
            variant="ghost"
            className="hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
            onClick={() => router.push("/discover")}
          >
            <p className="sen text-sm sm:text-md font-bold">Discover</p>
          </Button>

          <Button
            variant="ghost"
            className="hidden lg:flex hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
            onClick={() => window.open("https://x.com/belisasari", "_blank")}
          >
            <p className="sen text-sm sm:text-md font-bold">Follow on</p>
            <Image src="/x.png" alt="logo" width={20} height={20} className="rounded-full" />
          </Button>

          {ready && authenticated ? (
            displayUsername ? (
              <div className="relative" ref={authDropdownRef}>
                <CreateProfileContainer onProfileCreated={setProfileUsername} />
                <Button
                  className="bg-iris-primary hover:bg-iris-primary/80 transform transition hover:scale-105"
                  onClick={() => setAuthOpen(!authOpen)}
                >
                  <p className="sen text-sm sm:text-md font-bold truncate max-w-[120px]">{displayUsername}</p>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
                {authOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg z-50 py-1">
                    <button
                      type="button"
                      className="flex w-full items-center px-4 py-2 text-sm hover:bg-muted"
                      onClick={() => { router.push("/profile"); setAuthOpen(false); }}
                    >
                      <User className="h-4 w-4 mr-2" /> My profile
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center px-4 py-2 text-sm hover:bg-muted"
                      onClick={() => { displayWallet && handleCopy(displayWallet); setAuthOpen(false); }}
                    >
                      {copied ? <Check className="h-4 w-4 mr-2" /> : null}
                      {displayWallet ? shortenAddress(displayWallet) : "Copy address"}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center px-4 py-2 text-sm text-destructive hover:bg-muted"
                      onClick={() => { logout(); setAddress(""); setAuthOpen(false); }}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <CreateProfileContainer onProfileCreated={setProfileUsername} />
                <Button className="bg-iris-primary/80 cursor-default" disabled>
                  <p className="sen text-sm sm:text-md font-bold">Create profile…</p>
                </Button>
              </>
            )
          ) : (
            <Button
              className="bg-iris-primary hover:bg-iris-primary/80 transform transition hover:scale-105"
              onClick={() => {
                if (ready && !authenticated) {
                  login({ loginMethods: ["wallet"], walletChainType: "solana-only" });
                } else if (!connected) {
                  setVisible(true);
                } else {
                  disconnect();
                }
              }}
            >
              <Image src="/solana.png" width={25} height={25} className="rounded-full" alt="wallet" />
              <p className="sen text-sm sm:text-md font-bold">
                {ready && !authenticated ? "Log in" : !connected ? "Connect Wallet" : shortenAddress(publicKey?.toString() ?? "")}
              </p>
            </Button>
          )}
        </div>
      </div>
      <div className="flex md:hidden mt-4 justify-center md:justify-start ">

        <Button
          variant="ghost"
          className="hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
          onClick={() => {
            router.push("/dashboard");
          }}
        >
          <p className="sen text-sm sm:text-md font-bold">
            Live Dashboard
          </p>
          <div className="w-2 h-2 bg-iris-primary rounded-full animate-pulse ml-2"></div>
        </Button>

        <Button
          variant="ghost"
          className="hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
          onClick={() => router.push("/trending-coins")}
        >
          <p className="sen text-sm sm:text-md font-bold">🚀 Trending Coins</p>
        </Button>

        <Button
          variant="ghost"
          className="hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
          onClick={() => router.push("/portfolio")}
        >
          <p className="sen text-sm sm:text-md font-bold">Portfolio</p>
        </Button>

        <Button
          variant="ghost"
          className="hidden lg:flex hover:bg-transparent hover:border-[1px] hover:border-white transform transition hover:scale-105"
          onClick={() => window.open("https://x.com/belisasari", "_blank")}
        >
          <p className="sen text-sm sm:text-md font-bold">Follow on</p>
          <Image
            src="/x.png"
            alt="logo"
            width={20}
            height={20}
            className="rounded-full"
          />
        </Button>

        <Button
          className="bg-iris-primary hover:bg-iris-primary/80 transform transition hover:scale-105"
          onClick={() => {
            if (!connected) setVisible(true);
            else disconnect();
          }}
        >
          <Image
            src={"/solana.png"}
            width={25}
            height={25}
            className="rounded-full"
            alt="phantom"
          />
          <p className="sen text-sm sm:text-md font-bold">
            {!connected
              ? "Connect Wallet"
              : shortenAddress(publicKey?.toString() ?? "")}
          </p>
        </Button>
      </div>

      <div className="w-full max-w-full overflow-x-hidden">{children}</div>
    </div>
  );
}

"use client";

import { useAppAuth } from "@/components/provider/PrivyAppAuthContext";
import { Check, ChevronDown, LogOut, User, Menu, X } from "lucide-react";
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
  const walletAddress = useEnvironmentStore((s) => s.walletAddress);
  const setAddress = useEnvironmentStore((s) => s.setAddress);
  const setPaid = useEnvironmentStore((s) => s.setPaid);
  const setBalances = useEnvironmentStore((s) => s.setBalances);
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (authDropdownRef.current && !authDropdownRef.current.contains(e.target as Node)) setAuthOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const { ready, authenticated, logout, login } = useAppAuth();
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
    const addr = privyWallet || walletAddress;
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
  }, [walletAddress, privyWallet, isClient, setPaid, setBalances]);

  const displayUsername = profileUsername ?? mainUsername;
  const displayWallet = privyWallet || walletAddress;

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({ title: "Copied address" });
    setTimeout(() => setCopied(false), 2000);
  };

  const navLinks = [
    { label: "🚀 Trending Coins", href: "/trending-coins" },
    { label: "Feed", href: "/feed" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Trading (Jupiter)", href: "/trading" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "NFTs", href: "/nfts" },
    { label: "Discover", href: "/discover" },
  ];

  return (
    <div className="w-full py-4 sm:py-6 relative">
      <div className="flex justify-between items-center px-4 sm:px-6">
        {/* Logo Section */}
        <div
          className="flex items-center space-x-3 sm:space-x-4 select-none cursor-pointer shrink-0"
          onClick={() => router.push("/")}
        >
          <Image
            src="/belisasari.png"
            alt="Belisasari Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <p className="font-bold text-lg sm:text-2xl crypto-futuristic tracking-widest text-text-main hidden sm:block">
            Belisasari
          </p>
        </div>

        {/* Search Bar - Center */}
        <div className="hidden lg:flex relative mx-4 justify-center flex-1 max-w-[400px]">
          <CommandMenu />
        </div>

        {/* Desktop Navbar */}
        <div className="hidden xl:flex items-center space-x-1 shrink-0">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              className="text-text-main/70 hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all font-semibold text-sm h-9 px-3"
              onClick={() => router.push(link.href)}
            >
              <span className="sen">{link.label}</span>
            </Button>
          ))}

          <Button
            variant="ghost"
            className="text-text-main/70 hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all font-semibold text-sm h-9 px-3 group"
            onClick={() => window.open("https://x.com/wojat118721", "_blank")}
          >
            <span className="sen mr-2 hidden 2xl:inline">Follow on</span>
            <Image src="/x.png" alt="logo" width={16} height={16} className="rounded-full opacity-70 group-hover:opacity-100 transition-opacity" />
          </Button>

          {/* User Auth Section Desktop */}
          <div className="ml-2 flex items-center">
            {ready && authenticated ? (
              displayUsername ? (
                <div className="relative" ref={authDropdownRef}>
                  <CreateProfileContainer onProfileCreated={setProfileUsername} />
                  <Button
                    className="bg-primary hover:bg-primary/80 text-background font-bold h-9 px-4 rounded-lg transform transition hover:scale-[1.02]"
                    onClick={() => setAuthOpen(!authOpen)}
                  >
                    <span className="truncate max-w-[120px] sen">{displayUsername}</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                  {authOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border-light bg-background-main shadow-xl z-50 py-1">
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-text-main/80 hover:bg-foreground/5 transition-colors"
                        onClick={() => { router.push("/profile"); setAuthOpen(false); }}
                      >
                        <User className="h-4 w-4 mr-2 text-[#00D4FF]" /> My profile
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        onClick={() => { displayWallet && handleCopy(displayWallet); setAuthOpen(false); }}
                      >
                        {copied ? <Check className="h-4 w-4 mr-2 text-green-400" /> : <LogOut className="h-4 w-4 mr-2 opacity-0" />}
                        {displayWallet ? shortenAddress(displayWallet) : "Copy address"}
                      </button>
                      <div className="h-[1px] bg-border my-1 px-2" />
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-[#FF3B3B] hover:bg-foreground/5 transition-colors"
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
                  <Button className="bg-primary/50 text-background font-bold h-9 px-4 rounded-lg cursor-not-allowed" disabled>
                    <span className="sen">Create profile…</span>
                  </Button>
                </>
              )
            ) : (
              <Button
                className="bg-primary hover:bg-primary/80 text-background font-bold h-9 px-4 rounded-lg group transform transition hover:scale-[1.02]"
                disabled={!ready || (ready && authenticated)}
                onClick={() => {
                  if (ready && !authenticated) {
                    login({
                      loginMethods: ["wallet"],
                      walletChainType: "solana-only",
                      disableSignup: false,
                    });
                  }
                }}
              >
                <div className="w-5 h-5 mr-2 rounded-full overflow-hidden shrink-0 group-hover:scale-110 transition-transform bg-black/10 flex items-center justify-center">
                  <Image src="/solana.png" width={20} height={20} alt="wallet" />
                </div>
                <span className="sen font-bold">
                  {!ready ? "Loading…" : authenticated && displayWallet ? shortenAddress(displayWallet) : "Log in"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navbar Hamburger */}
        <div className="flex xl:hidden items-center space-x-2 shrink-0">
          {!authenticated ? (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/80 text-background font-bold h-9 px-4"
              disabled={!ready}
              onClick={() => {
                if (ready && !authenticated) {
                  login({
                    loginMethods: ["wallet"],
                    walletChainType: "solana-only",
                    disableSignup: false,
                  });
                }
              }}
            >
              Log in
            </Button>
          ) : (
            displayUsername ? (
              <Button
                size="sm"
                className="bg-background-main border border-border-light hover:bg-foreground/5 text-text-main font-bold h-9 px-3"
                onClick={() => router.push("/profile")}
              >
                <User className="h-4 w-4 text-[#00D4FF]" />
              </Button>
            ) : null
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-text-main hover:bg-foreground/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-background-main/95 backdrop-blur-xl border-b border-border-light z-50 p-4 shadow-2xl flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="mb-4">
            <CommandMenu />
          </div>
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className="justify-start text-text-main/80 hover:text-text-main hover:bg-foreground/10 text-lg h-12 px-4 rounded-xl font-medium"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push(link.href);
                }}
              >
                {link.label}
              </Button>
            ))}
            
            <div className="h-[1px] bg-border my-2 mx-4" />
            
            <Button
              variant="ghost"
              className="justify-start text-white/80 hover:text-white hover:bg-white/10 text-lg h-12 px-4 rounded-xl font-medium"
              onClick={() => window.open("https://x.com/wojat118721", "_blank")}
            >
              Follow on X <Image src="/x.png" alt="logo" width={20} height={20} className="rounded-full ml-3 opacity-80" />
            </Button>
            
            {authenticated && (
              <Button
                variant="ghost"
                className="justify-start mt-2 bg-[#FF3B3B]/10 text-[#FF3B3B] hover:bg-[#FF3B3B]/20 hover:text-[#FF3B3B] text-lg h-12 px-4 rounded-xl font-medium"
                onClick={() => {
                  logout();
                  setAddress("");
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-5 w-5 mr-3" /> Log out
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-full overflow-x-hidden pt-4 xl:pt-8">{children}</div>
    </div>
  );
}

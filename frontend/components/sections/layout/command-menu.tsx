"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import { type DialogProps } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useEnvironmentStore } from "@/components/context";
import UnlockNow from "@/components/unlock-now";
import { SearchTokenResponse } from "@/lib/types";
import Image from "next/image";
import { IPFS_GATEWAY_URL, IPFS_GATEWAY_URL_4 } from "@/lib/constants";

export default function CommandMenu({ ...props }: ButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const paid = useEnvironmentStore((s) => s.paid);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const searchBarValue = useEnvironmentStore((s) => s.searchBarValue);
  const setSearchBarValue = useEnvironmentStore((s) => s.setSearchBarValue);
  const leaderboard = useEnvironmentStore((s) => s.leaderboard);
  const [searchState, setSearchState] = useState(0);
  const [resultImages, setResultImages] = useState<Record<number, string>>({});

  React.useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    // Only add event listeners after we're on the client side
    if (!isClient) return;

    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isClient]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      console.log("SEARCH TERM", searchTerm);
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setSearchState(1);
        return;
      }

      try {
        setSearchState(2);
        fetch(`/api/supabase/search-tokens?searchTerm=${searchTerm}`)
          .then((res) => res.json())
          .then((data) => {
            setSearchState(data.length > 0 ? 0 : 1);
            setSearchResults(data);
          });
      } catch (error) {
        console.error("Search failed", error);
        setSearchState(1);
      }
    }, 300),
    []
  );

  useEffect(() => {
    setResultImages({});
    if (searchResults.length === 0) return;
    let cancelled = false;
    searchResults.forEach((result, index) => {
      const uriPart = result.uri?.split("/").at(-1);
      if (!uriPart) return;
      fetch(IPFS_GATEWAY_URL_4 + uriPart)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          const imagePath = data?.image?.split("/").at(-1);
          if (imagePath) {
            setResultImages((prev) => ({ ...prev, [index]: IPFS_GATEWAY_URL_4 + imagePath }));
          }
        })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [searchResults]);

  const getResultImage = (result: { image?: string }, id: number) => resultImages[id] ?? result?.image;
  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "sen relative h-10 flex w-full sm:w-80 bg-muted/50 text-sm font-normal text-text-secondary shadow-none sm:pr-12 md:w-40 lg:w-56 xl:w-80"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="inline-flex sm:hidden md:hidden lg:inline-flex w-full text-start ">
          Search memecoins...
        </span>
        <span className="hidden sm:inline-flex md:inline-flex lg:hidden w-full text-start">
          Search...
        </span>
        <kbd className="pointer-events-none absolute right-[0.4rem] top-[0.4rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-md font-medium opacity-100 sm:flex">
          <span className="text-sm">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        {paid ? (
          <>
            <CommandInput
              value={searchBarValue}
              onValueChange={(search) => {
                setSearchBarValue(search);
                debouncedSearch(search);
              }}
              placeholder="Type a ticker or search..."
            />
            <CommandList>
              <CommandEmpty>
                {searchState == 0
                  ? "No results found"
                  : searchState == 1
                  ? "Type a longer search term"
                  : "Loading..."}
              </CommandEmpty>
              <CommandGroup heading="Memecoins">
                {Array.isArray(
                  searchBarValue == "" ? leaderboard : searchResults
                ) &&
                  (searchBarValue == "" ? leaderboard : searchResults).map(
                    (navItem, id) => (
                      <CommandItem
                        key={id}
                        value={navItem.symbol + id}
                        onSelect={() => {
                          runCommand(() => router.push("/token/" + navItem.id));
                        }}
                        className="data-[selected='true']:bg-secondary cursor-pointer"
                      >
                        {getResultImage(navItem, id) ? (
                          <img
                            src={getResultImage(navItem, id)}
                            alt={navItem.symbol}
                            className="h-4 w-4 mr-1 rounded-full"
                            onError={(e: any) => {
                              e.target.onerror = null; // Prevent infinite loop
                              e.target.src = "/memecoins/placeholder.png";
                            }}
                          />
                        ) : (
                          <div className="h-4 w-4 mr-1 rounded-full animate-spin border-2 border-transparent border-t-accent"></div>
                        )}
                        <span>{navItem.symbol}</span>
                        <span className="text-accent">/ SOL</span>
                        <span className="ml-auto text-text-secondary">
                          {navItem.name}
                        </span>
                      </CommandItem>
                    )
                  )}
              </CommandGroup>

              <CommandSeparator />
            </CommandList>
          </>
        ) : (
          <div className="h-[300px] flex flex-col justify-center">
            <UnlockNow text="Search and analyze all memecoins" />
          </div>
        )}
      </CommandDialog>
    </>
  );
}

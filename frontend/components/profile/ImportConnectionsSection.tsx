'use client';

import { Button } from '@/components/ui/button';
import { useGetIdentities } from '@/hooks/use-get-identities';
import type { IProfileList } from '@/lib/types/profile';
import { ChevronDown, Link2, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ImportConnectionsSectionProps {
  walletAddress: string;
}

export function ImportConnectionsSection({ walletAddress }: ImportConnectionsSectionProps) {
  const { data: identities, loading } = useGetIdentities({ walletAddress });
  const [open, setOpen] = useState(false);

  const list: IProfileList[] = [];
  identities?.identities?.forEach((identity) => {
    identity.profiles?.forEach((entry) => {
      list.push(entry);
    });
  });

  return (
    <div className="mt-8 rounded-xl border bg-card-bg overflow-hidden">
      <Button
        variant="ghost"
        className="w-full justify-between rounded-none px-4 py-3 h-auto hover:bg-muted/50"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2 font-medium">
          <Link2 className="h-4 w-4" /> Tapestry connections
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <div className="border-t px-4 py-3">
          {loading ? (
            <p className="text-sm text-text-secondary">Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No other Tapestry profiles linked to this wallet. When you use other apps with Tapestry, they will appear here.
            </p>
          ) : (
            <>
              <p className="text-sm text-text-secondary mb-2">
                Profiles from other apps (same wallet):
              </p>
              <ul className="space-y-2">
                {list.map((entry, i) => (
                  <li
                    key={`${entry.profile.id}-${i}`}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    {entry.profile.image ? (
                      <Image
                        src={entry.profile.image}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">@{entry.profile.username}</p>
                      {entry.profile.bio && (
                        <p className="text-xs text-text-secondary truncate">{entry.profile.bio}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

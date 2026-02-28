'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProfile } from '@/hooks/use-profile';

interface CreateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  onSuccess: (username: string) => void;
}

export function CreateProfileDialog({
  open,
  onOpenChange,
  walletAddress,
  onSuccess,
}: CreateProfileDialogProps) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const { createProfile, loading, error } = useCreateProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (normalized.length < 2) return;
    try {
      await createProfile({
        walletAddress,
        username: normalized,
        bio: bio.trim() || undefined,
      });
      onSuccess(normalized);
      onOpenChange(false);
      setUsername('');
      setBio('');
    } catch {
      // error state handled in useCreateProfile
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(v);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card-bg border-border-light text-text-main shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create profile</DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Choose a username for your Belisasari profile. You can add a short bio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-text-main/90">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="username"
              minLength={2}
              maxLength={30}
              required
              className="bg-foreground/5 border-border-light text-text-main focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] placeholder:text-[#6B7280]"
            />
            <p className="text-[12px] text-[#6B7280]">
              Letters, numbers, and underscore only. Min 2 characters.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-text-main/90">Bio (optional)</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio"
              maxLength={160}
              className="bg-foreground/5 border-border-light text-text-main focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] placeholder:text-[#6B7280]"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-border-light">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#6B7280] hover:text-text-main hover:bg-foreground/5"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || username.replace(/[^a-z0-9_]/g, '').length < 2}
              className="bg-[#00D4FF] text-[#111118] hover:bg-[#00D4FF]/80 hover:text-[#111118]"
            >
              {loading ? 'Creating...' : 'Create profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

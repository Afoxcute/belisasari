'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

interface EditProfileDialogProps {
  profileId: string;
  currentUsername: string;
  currentBio?: string | null;
  currentImage?: string | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditProfileDialog({
  profileId,
  currentUsername,
  currentBio,
  currentImage,
  onSuccess,
  trigger,
}: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [bio, setBio] = useState(currentBio ?? '');
  const [image, setImage] = useState(currentImage ?? '');
  const { updateProfile, loading, error } = useUpdateProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ profileId, username: username.trim(), bio: bio.trim() || undefined, image: image.trim() || undefined });
      setOpen(false);
      onSuccess?.();
    } catch {
      // error in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="bg-foreground/5 border-border-light text-text-main hover:bg-foreground/10 transition-colors">
            <Pencil className="h-4 w-4 mr-2" /> Edit profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card-bg border-border-light text-text-main shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Edit profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-text-main/90 uppercase tracking-wide">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              placeholder="username"
              className="bg-foreground/5 border-border-light text-text-main focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] placeholder:text-[#6B7280]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-text-main/90 uppercase tracking-wide">Bio</label>
            <Input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio"
              className="bg-foreground/5 border-border-light text-text-main focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] placeholder:text-[#6B7280]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-text-main/90 uppercase tracking-wide">Image URL</label>
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="bg-foreground/5 border-border-light text-text-main focus-visible:ring-1 focus-visible:ring-[#00D4FF] focus-visible:border-[#00D4FF] placeholder:text-[#6B7280]"
            />
          </div>
          {error && <p className="text-[13px] font-medium text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-3 border-t border-border-light">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="text-[#6B7280] hover:text-text-main hover:bg-foreground/5"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-[#00D4FF] text-[#111118] hover:bg-[#00D4FF]/80 hover:text-[#111118] px-6"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

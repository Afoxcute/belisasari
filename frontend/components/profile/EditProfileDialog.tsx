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
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1" /> Edit profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              placeholder="username"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Bio</label>
            <Input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface UserProfile {
  id: number;
  user_id: string;
  username: string | null;
  email: string | null;
  preferences: Record<string, unknown>;
  trading_experience: string;
  risk_tolerance: string;
  favorite_tokens: string[] | null;
  notification_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_active: string;
  metadata: { bio?: string; image?: string } & Record<string, unknown>;
}

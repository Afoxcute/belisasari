export interface ISocialCounts {
  followers: number;
  following: number;
}

export interface IProfile {
  id: string;
  namespace: string;
  created_at: number;
  username: string;
  bio?: string | null;
  image?: string | null;
}

export interface INamespace {
  id: number;
  name: string;
  readableName: string | null;
  faviconURL: string | null;
  created_at: string;
  updatedAt: string;
  isDefault: boolean;
  team_id: number;
}

export interface IProfileList {
  profile: IProfile;
  wallet: { address: string };
  namespace: INamespace;
}

export interface IIdentitiesResponse {
  identities: IIdentity[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface IIdentity {
  profiles: IProfileList[];
  wallet: { address: string };
}

/** Tapestry content (post) list item */
export interface IContentItem {
  content: { id: string; created_at: number; namespace: string } | null;
  socialCounts: { likeCount: number; commentCount: number };
  authorProfile: IProfile;
  requestingProfileSocialInfo?: { hasLiked?: boolean };
}

/** Tapestry activity feed item */
export interface IActivityItem {
  type: 'following' | 'new_content' | 'like' | 'comment' | 'new_follower';
  actor_id: string;
  actor_username: string;
  target_id?: string;
  target_username?: string;
  timestamp: number;
  activity: string;
}

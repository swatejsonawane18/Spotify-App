export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Video {
  id: string;
  uri: string;
  signedUrl?: string | null;
  user_id: string;
  created_at: string;
  title?: string;
  description?: string;
  User?: User;
}

export interface Comment {
  id: string;
  text: string;
  user_id: string;
  video_id: string;
  created_at: string;
  User?: User;
}

export interface Like {
  id: string;
  user_id: string;
  video_id: string;
  video_user_id: string;
  created_at: string;
}

export interface Follower {
  id: string;
  user_id: string;
  follower_user_id: string;
  created_at: string;
}
export type User = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  token: string;
  isAuthenticated: boolean;
  userFollowers: string[];
  userFollowees: string[];
  postsCount: number;
  profilePicture?: string | null;
};

import { User } from "./User";

export type Post = {
  id: number;
  poster: User;
  content: string;
  timestamp: string;
  postLikes: number;
  isLiked: boolean;
  image?: string | null;
};

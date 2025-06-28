import { User } from "./User";

export type Comment = {
  id: number;
  postId: number;
  commenter: User;
  content: string;
  timestamp: string;
};

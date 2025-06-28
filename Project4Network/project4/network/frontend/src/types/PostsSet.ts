import { Post } from "./Post";

export type PostsSet = {
  count: number;
  next?: string;
  previous?: string;
  posts: Map<number, Post>;
};

import { Post, User } from ".";

export type Dashboard = {
  new_users: Map<number, User>;
  active_users: Map<number, User>;
  recent_posts: Map<number, Post>;
  top_posts: Map<number, Post>;
  top_posters: Map<number, User & { post_count: number }>;
};

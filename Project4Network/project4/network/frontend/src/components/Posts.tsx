import { observer } from "mobx-react";
import { Post } from "../types/Post";
import { PostItem } from "./Post";

export const Posts = observer(({ posts, disabled = false }: { posts: Map<number, Post>; disabled?: boolean }) => {
  return (
    <>
      {Array.from(posts.values()).map((post) => (
        <PostItem key={post.id} post={post} disabled={disabled} />
      ))}
    </>
  );
});

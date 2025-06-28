import { observer } from "mobx-react-lite";
import { CommentItem } from "./Comment";
import { NoData } from "./NoData";
import { useVM } from "../viewModel/context";
import { Comment } from "../types/Comment";

export const Comments = observer(({ postId }: { postId: number }) => {
  const vm = useVM();
  // Retrieve the comments for this post from the VM.
  const comments = vm.GetComments(postId) || [];

  if (comments.length === 0) return <NoData message="No comments yet." />;

  return (
    <>
      {comments.map((comment: Comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </>
  );
});

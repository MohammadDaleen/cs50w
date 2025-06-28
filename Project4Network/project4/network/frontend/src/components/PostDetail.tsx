import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router-dom";
import { useVM } from "../viewModel/context";
import { PostItem } from "./Post";
import { Loading } from "./Loading";
import { NoData } from "./NoData";
import { NewCommentForm } from "./NewCommentForm";
import { Comments } from "./Comments";
import { Button, makeStyles, Subtitle1 } from "@fluentui/react-components";
import { ChevronLeftFilled } from "@fluentui/react-icons";
import { NotFound } from "./NotFound";
import { Container } from "react-bootstrap";

const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  back: {
    marginTop: "1rem",
  },
  title: {
    marginTop: "1rem",
    marginBottom: "1rem",
  },
});

export const PostDetail = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  // Get the postId from URL params
  const params = useParams();

  useEffect(() => {
    if (!params.postId) {
      vm.SetError("Couldn't get the post ID from the URL");
      return;
    }
    // Retrieve the post from one of the VM's Maps using the postId.
    const id = Number.parseInt(params.postId);
    // Try to retrieve the post from any of the VM's Maps:
    vm.CurrentPost = vm.Posts.get(id) || vm.VisitedUserPosts.get(id) || vm.FollowingPosts.get(id);
    if (vm.CurrentPost) {
      vm.FetchComments(vm.CurrentPost.id).finally(() => setIsLoading(false));
    } else {
      // Post not in Maps, fetch it from the backend
      vm.FetchCurrentPost(id).then(() => {
        if (vm.CurrentPost) {
          vm.FetchComments(vm.CurrentPost.id).finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }
      });
    }
  }, []);

  if (isLoading) return <Loading message="Loading Post..." />;
  if (!vm.CurrentPost) return <NotFound />;
  if (vm.ErrorMessage) return <NoData />;

  return (
    <Container className={styles.mobileContainer}>
      {/* // TODO: When going back, go to the exact post */}
      <Button
        className={styles.back}
        onClick={() => navigate(-1)}
        icon={<ChevronLeftFilled />}
        size="large"
        appearance="subtle"
      />
      <PostItem post={vm.CurrentPost} />
      <Subtitle1 className={styles.title}>Comments</Subtitle1>
      <NewCommentForm postId={vm.CurrentPost.id} />
      <Comments postId={vm.CurrentPost.id} />
    </Container>
  );
});

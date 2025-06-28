import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useVM } from "../viewModel/context";
import { Posts } from "./Posts";
import { Loading } from "./Loading";
import { NoData } from "./NoData";
import InfiniteScroll from "react-infinite-scroll-component";
import { Container } from "react-bootstrap";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  noData: {
    marginTop: "3rem",
    marginBottom: "3rem",
  },
});

export const FollowingPage = observer(() => {
  const styles = useStyles();
  const vm = useVM();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!vm.ErrorMessage) {
      vm.FetchFollowingPosts(1).finally(() => {
        setIsLoading(false);
      });
    }
  }, []);

  // Function to load more posts when the user scrolls.
  const fetchMoreFollowingPosts = async () => {
    vm.FollowingPostSetNumber += 1;
    await vm.FetchFollowingPosts(vm.FollowingPostSetNumber);
  };

  if (isLoading) return <Loading message={"Loading Following Page..."} />;

  return (
    <>
      {!vm.FollowingPosts || !(vm.FollowingPosts.size > 0) ? (
        <NoData message={"No Posts Yet! Follow Others To See Thier Posts Here."} />
      ) : (
        <InfiniteScroll
          dataLength={vm.FollowingPosts.size}
          next={fetchMoreFollowingPosts}
          hasMore={vm.HasMoreFollowingPosts}
          loader={<Loading message={"Loading more posts..."} />}
          // TODO: change style (make different componenet)*
          endMessage={
            <div className={styles.noData}>
              <NoData message={"No more posts to show."} addPadding={false} />
            </div>
          }
        >
          <Container className={styles.mobileContainer}>
            <Posts posts={vm.FollowingPosts} />
          </Container>
        </InfiniteScroll>
      )}
    </>
  );
});

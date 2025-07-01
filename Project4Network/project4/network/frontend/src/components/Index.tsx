import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useVM } from "../viewModel/context";
import { NewPostForm } from "./NewPostForm";
import { Posts } from "./Posts";
import { Loading } from "./Loading";
import { NoData } from "./NoData";
import { makeStyles } from "@fluentui/react-components";
import { Container } from "react-bootstrap";

const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  noData: {
    marginTop: "3rem",
    marginBottom: "3rem",
  },
});

export const Index = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!vm.ErrorMessage) {
      vm.FetchMainPage(1).finally(() => {
        setIsLoading(false);
      });
    }
  }, []);

  // Function to load more posts when user scrolls down
  const fetchMorePosts = async () => {
    vm.PostSetNumber += 1;
    await vm.FetchMainPage(vm.PostSetNumber);
  };

  if (isLoading) return <Loading message={"Loading Posts..."} />;

  return (
    <>
      {/* Only authenticated users are allowed to post new posts */}
      {vm.Token && vm.User?.isAuthenticated && (
        <Container className={styles.mobileContainer}>
          <NewPostForm />
        </Container>
      )}
      <InfiniteScroll
        dataLength={vm.Posts?.size || 0}
        next={fetchMorePosts}
        hasMore={vm.HasMorePosts}
        loader={<Loading message={"Loading more posts..."} />}
        // TODO: change style (make different componenet)*
        endMessage={
          <div className={styles.noData}>
            <NoData message={"No more posts to show."} addPadding={false} />
          </div>
        }
      >
        <Container className={styles.mobileContainer}>
          {!vm.Posts || !(vm.Posts.size > 0) ? (
            <NoData message={"No Posts Yet!"} />
          ) : (
            <Posts posts={vm.Posts} disabled={!(vm.Token && vm.User?.isAuthenticated)} />
          )}
        </Container>
      </InfiniteScroll>
    </>
  );
});

import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useVM } from "../viewModel/context";
import { Posts } from "./Posts";
import { Loading } from "./Loading";
import { NoData } from "./NoData";
import { Container, Pagination } from "react-bootstrap";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  noData: {
    marginTop: "3rem",
    marginBottom: "3rem",
  },
  pagenation: {
    display: "flex",
    justifyContent: "center",
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

  /**
   * Handles page change for the following page posts.
   * This function updates the `FollowingPostSetNumber` in the view model
   * and fetches the posts for the following page.
   * It also handles loading state and error messages.
   * @param page - The new page number to fetch.
   * @returns {Promise<void>}
   */
  const handlePageChange = async (page: number) => {
    vm.FollowingPostSetNumber = page;
    setIsLoading(true);
    await vm.FetchFollowingPosts(page);
    setIsLoading(false);
  };

  if (isLoading) return <Loading message={"Loading Following Page..."} />;

  return (
    <>
      <Container className={styles.mobileContainer}>
        {/* Ensure posts exist */}
        {!vm.FollowingPosts || !(vm.FollowingPosts.size > 0) ? (
          <NoData message={"No Posts Yet! Follow Others To See Thier Posts Here."} />
        ) : (
          <Posts posts={vm.FollowingPosts} disabled={!(vm.Token && vm.User?.isAuthenticated)} />
        )}
        {/* Pagination Component */}
        <Pagination className={styles.pagenation}>
          <Pagination.Prev
            onClick={() => handlePageChange(vm.FollowingPostSetNumber - 1)}
            disabled={vm.FollowingPostSetNumber === 1}
          />
          {vm.FollowingPostSetNumber !== 1 && (
            <Pagination.Item onClick={() => handlePageChange(vm.FollowingPostSetNumber - 1)}>
              {vm.FollowingPostSetNumber - 1}
            </Pagination.Item>
          )}
          <Pagination.Item active>{vm.FollowingPostSetNumber}</Pagination.Item>
          {vm.HasMoreFollowingPosts && (
            <Pagination.Item onClick={() => handlePageChange(vm.FollowingPostSetNumber + 1)}>
              {vm.FollowingPostSetNumber + 1}
            </Pagination.Item>
          )}
          <Pagination.Next
            onClick={() => handlePageChange(vm.FollowingPostSetNumber + 1)}
            disabled={!vm.HasMoreFollowingPosts}
          />
        </Pagination>
      </Container>
    </>
  );
});

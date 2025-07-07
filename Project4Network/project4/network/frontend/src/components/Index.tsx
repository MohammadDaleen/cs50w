import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useVM } from "../viewModel/context";
import { NewPostForm } from "./NewPostForm";
import { Posts } from "./Posts";
import { Loading } from "./Loading";
import { NoData } from "./NoData";
import { makeStyles } from "@fluentui/react-components";
import { Container, Pagination } from "react-bootstrap";

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

  /**
   * Function to handle page changes in the pagination.
   * It updates the current page number and fetches the posts for that page.
   * @param page - The new page number to fetch.
   * @returns {Promise<void>}
   */
  const handlePageChange = async (page: number) => {
    vm.PostSetNumber = page;
    setIsLoading(true);
    await vm.FetchMainPage(page);
    setIsLoading(false);
  };

  if (isLoading) return <Loading message={"Loading Posts..."} />;

  return (
    <>
      {/* Only authenticated users are allowed to post new posts */}
      {vm.GetToken() && vm.User?.isAuthenticated && (
        <Container className={styles.mobileContainer}>
          <NewPostForm />
        </Container>
      )}
      <Container className={styles.mobileContainer}>
        {/* Ensure posts exist */}
        {!vm.Posts || !(vm.Posts.size > 0) ? (
          <NoData message={"No Posts Yet!"} />
        ) : (
          <>
            <Posts posts={vm.Posts} disabled={!(vm.GetToken() && vm.User?.isAuthenticated)} />
            {/* Pagination Component */}
            <Pagination className={styles.pagenation}>
              <Pagination.Prev
                onClick={() => handlePageChange(vm.PostSetNumber - 1)}
                disabled={vm.PostSetNumber === 1}
              />
              {vm.PostSetNumber !== 1 && (
                <Pagination.Item onClick={() => handlePageChange(vm.PostSetNumber - 1)}>
                  {vm.PostSetNumber - 1}
                </Pagination.Item>
              )}
              <Pagination.Item active>{vm.PostSetNumber}</Pagination.Item>
              {vm.HasMorePosts && (
                <Pagination.Item onClick={() => handlePageChange(vm.PostSetNumber + 1)}>
                  {vm.PostSetNumber + 1}
                </Pagination.Item>
              )}
              <Pagination.Next onClick={() => handlePageChange(vm.PostSetNumber + 1)} disabled={!vm.HasMorePosts} />
            </Pagination>
          </>
        )}
      </Container>
    </>
  );
});

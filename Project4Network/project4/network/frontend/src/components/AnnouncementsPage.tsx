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

export const AnnouncementsPage = observer(() => {
  const styles = useStyles();
  const vm = useVM();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!vm.ErrorMessage) {
      vm.FetchAnnouncementsPosts(1).finally(() => setIsLoading(false));
    }
  }, []);

  /**
   * Handles page change for the announcements page posts.
   * This function updates the `AnnouncementsPostSetNumber` in the view model
   * and fetches the posts for the announcements page.
   * It also handles loading state and error messages.
   * @param page - The new page number to fetch.
   * @returns {Promise<void>}
   */
  const handlePageChange = async (page: number) => {
    vm.AnnouncementsPostSetNumber = page;
    setIsLoading(true);
    await vm.FetchAnnouncementsPosts(page);
    setIsLoading(false);
  };

  if (isLoading) return <Loading message="Loading Announcements..." />;

  return (
    <Container className={styles.mobileContainer}>
      {/* Ensure posts exist */}
      {!vm.AnnouncementsPosts || !(vm.AnnouncementsPosts.size > 0) ? (
        <NoData message="No Announcements Yet!" />
      ) : (
        <Posts posts={vm.AnnouncementsPosts} disabled={!(vm.Token && vm.User?.isAuthenticated)} />
      )}
      {/* Pagination Component */}
      <Pagination className={styles.pagenation}>
        <Pagination.Prev
          onClick={() => handlePageChange(vm.AnnouncementsPostSetNumber - 1)}
          disabled={vm.AnnouncementsPostSetNumber === 1}
        />
        {vm.AnnouncementsPostSetNumber !== 1 && (
          <Pagination.Item onClick={() => handlePageChange(vm.AnnouncementsPostSetNumber - 1)}>
            {vm.AnnouncementsPostSetNumber - 1}
          </Pagination.Item>
        )}
        <Pagination.Item active>{vm.AnnouncementsPostSetNumber}</Pagination.Item>
        {vm.HasMoreAnnouncementsPosts && (
          <Pagination.Item onClick={() => handlePageChange(vm.AnnouncementsPostSetNumber + 1)}>
            {vm.AnnouncementsPostSetNumber + 1}
          </Pagination.Item>
        )}
        <Pagination.Next
          onClick={() => handlePageChange(vm.AnnouncementsPostSetNumber + 1)}
          disabled={!vm.HasMoreAnnouncementsPosts}
        />
      </Pagination>
    </Container>
  );
});

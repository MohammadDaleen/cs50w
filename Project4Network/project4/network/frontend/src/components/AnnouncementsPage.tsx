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

export const AnnouncementsPage = observer(() => {
  const styles = useStyles();
  const vm = useVM();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!vm.ErrorMessage) {
      vm.FetchAnnouncementsPosts(1).finally(() => setIsLoading(false));
    }
  }, []);

  // Function to load more posts when the user scrolls.
  const fetchMoreAnnouncementsPosts = async () => {
    vm.AnnouncementsPostSetNumber += 1;
    await vm.FetchAnnouncementsPosts(vm.AnnouncementsPostSetNumber);
  };

  if (isLoading) return <Loading message="Loading Announcements..." />;

  return !vm.AnnouncementsPosts || !(vm.AnnouncementsPosts.size > 0) ? (
    <NoData message="No Announcements Yet!" />
  ) : (
    <InfiniteScroll
      dataLength={vm.AnnouncementsPosts.size}
      next={fetchMoreAnnouncementsPosts}
      hasMore={vm.HasMoreAnnouncementsPosts}
      loader={<Loading message="Loading more announcements..." />}
      endMessage={
        <div className={styles.noData}>
          <NoData message="No more announcements to show." addPadding={false} />
        </div>
      }
    >
      <Container className={styles.mobileContainer}>
        <Posts posts={vm.AnnouncementsPosts} />
      </Container>
    </InfiniteScroll>
  );
});

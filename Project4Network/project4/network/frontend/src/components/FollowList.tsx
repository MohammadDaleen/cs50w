import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  SearchBox,
  Title2,
  Button,
  makeStyles,
  SearchBoxChangeEvent,
  InputOnChangeData,
} from "@fluentui/react-components";
import { ChevronLeftFilled, PersonSearchFilled, SearchFilled } from "@fluentui/react-icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { useVM } from "../viewModel/context";
import { NotFound } from "./NotFound";
import { User } from "../types/User";
import { UsersSet } from "../types/UsersSet";
import { Container } from "react-bootstrap";
import { Loading } from "./Loading";
import { NoData } from "./NoData";
import { Users } from "./Users";

const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  header: {
    marginTop: "1rem",
    marginBottom: "1rem",
    // display: "flex",
    // justifyContent: "space-between",
    display: "grid",

    gridTemplateColumns:
      // 1fr: left flexible "push" space
      // auto: exactly as wide as the title content
      // 1fr: right flexible "push" space
      // → this makes the title cell sit dead-center in the entire header
      "1fr auto 1fr",
    alignItems: "center",
  },
  back: {
    // in the left 1fr cell, hug the left edge
    justifySelf: "start",
  },
  title: {
    // in its auto-sized cell (the middle), it'll already be centered
    // no extra justifySelf needed—grid symmetry does the work
    // justifySelf: "center",
  },
  placeholder: {
    // in the right 1fr cell, hug the right edge
    justifySelf: "end",
  },
  searchBar: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  searchBox: {
    width: "100%",
  },
});

export const FollowList = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const navigate = useNavigate();
  const { username, listType } = useParams<{ username: string; listType: string }>();

  // grab and set ?q= from the URL
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";

  // Combined state object.
  const [state, setState] = useState<{
    page: number;
    users: User[];
    hasMore: boolean;
    searchQuery: string;
    isLoading: boolean;
  }>({
    page: 1,
    users: [],
    hasMore: false,
    searchQuery: queryParam,
    isLoading: true,
  });

  // When username, type, or queryParam changes, reset and fetch data.
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      page: 1,
      users: [],
      hasMore: false,
      searchQuery: queryParam,
      isLoading: true,
    }));
    fetchData(true);
    // TODO: remove the following line if not needed
    // ***** eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, listType, queryParam]);

  // Validate the list type.
  if (!(listType === "followers" || listType === "followees")) return <NotFound />;
  if (!username) return <NotFound />;

  // Function to fetch data; if reset is true, it resets the page number and users list.
  const fetchData = async (reset: boolean = false) => {
    const currentPage = reset ? 1 : state.page;
    let fetched: UsersSet | undefined;
    if (listType === "followers") {
      fetched = await vm.FetchFollowers(username, currentPage, queryParam);
    } else {
      fetched = await vm.FetchFollowees(username, currentPage, queryParam);
    }
    setState((prev) => ({
      ...prev,
      users: reset ? fetched?.users || [] : [...prev.users, ...(fetched?.users || [])],
      page: currentPage + 1,
      hasMore: fetched && fetched.users.length < 10 ? false : true,
      isLoading: false,
    }));
  };

  const handleSearch = () => {
    const newQ = state.searchQuery;
    // If nothing changed, bail out
    if (newQ === queryParam) return;

    // Otherwise push or clear
    if (newQ) {
      // new search, replace current entry
      setSearchParams({ q: newQ }, { replace: true });
    } else {
      // cleared search, replace current entry
      setSearchParams({}, { replace: true });
    }
  };

  if (state.isLoading) return <Loading message="Loading Users..." />;

  return (
    <Container className={styles.mobileContainer}>
      <div className={styles.header}>
        <Button
          className={styles.back}
          onClick={() => navigate(-1)}
          icon={<ChevronLeftFilled />}
          size="large"
          appearance="subtle"
        />
        <Title2 className={styles.title}>{listType === "followers" ? "Followers" : "Following"}</Title2>
        {/* empty placeholder so grid keeps 3 cols */}
        <div className={styles.placeholder} />
      </div>
      {!vm.ErrorMessage && vm.VisitedUser?.username === username && (
        <div className={styles.searchBar}>
          <SearchBox
            className={styles.searchBox}
            contentBefore={<PersonSearchFilled />}
            placeholder="Search users..."
            value={state.searchQuery}
            autoFocus
            onChange={(event: SearchBoxChangeEvent, data: InputOnChangeData) => {
              setState((prev) => ({ ...prev, searchQuery: data.value || "" }));
              // if it's a dismiss click (empty value + click event)
              // AND there was a query in the URL?, clear the URL
              if (event.type === "click" && data.value.length === 0 && queryParam.length !== 0) {
                setSearchParams({}, { replace: true }); // removes ?q
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            size="large"
            disabled={
              listType === "followers"
                ? vm.VisitedUser.userFollowers.length === 0
                : vm.VisitedUser.userFollowees.length === 0
            }
          />
          <Button
            onClick={handleSearch}
            icon={<SearchFilled />}
            size="large"
            appearance="primary"
            disabled={
              listType === "followers"
                ? vm.VisitedUser.userFollowers.length === 0
                : vm.VisitedUser.userFollowees.length === 0
            }
          />
        </div>
      )}
      {vm.ErrorMessage ? (
        <NotFound />
      ) : state.users.length > 0 ? (
        <InfiniteScroll
          dataLength={state.users.length}
          next={() => fetchData()}
          hasMore={state.hasMore}
          loader={<Loading message={"Loading more users..."} />}
          // TODO: change style (make different componenet)*
          endMessage={<NoData message={"No more users to show."} />}
        >
          <Users users={state.users} />
        </InfiniteScroll>
      ) : (
        <NoData />
      )}
    </Container>
  );
});

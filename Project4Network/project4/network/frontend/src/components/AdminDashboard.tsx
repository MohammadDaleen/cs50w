import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../viewModel/context";
import { Loading } from "./Loading";
import { Button, CounterBadge, Divider, List, ListItem, Subtitle1, makeStyles } from "@fluentui/react-components";
import { PanelBottomExpandFilled, PanelTopExpandFilled } from "@fluentui/react-icons";
import { Container } from "react-bootstrap";
import { NoData } from "./NoData";
import { Users } from "./Users";
import { Posts } from "./Posts";

const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  filter: {
    marginTop: "1rem",
    marginBottom: "1rem",
    width: "100%",
    display: "flex",
    gap: "0.5rem",
  },
  filterButton: {
    width: "100%",
  },
  listItem: {
    marginBottom: "1rem",
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  noData: {
    marginTop: "1rem",
    marginBottom: "1rem",
  },
  showButton: {
    justifySelf: "center",
    color: "gray",
    width: "100%",
  },
});

export const AdminDashboard = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "lifetime">("week");
  // track expansion per section
  const [expanded, setExpanded] = useState<{
    newUsers: boolean;
    activeUsers: boolean;
    topPosters: boolean;
    posts: boolean;
    top5Posts: boolean;
  }>({
    newUsers: false,
    activeUsers: false,
    topPosters: false,
    posts: false,
    top5Posts: false,
  });

  useEffect(() => {
    if (!vm.ErrorMessage) {
      vm.FetchDashboard(timeframe).finally(() => {
        setIsLoading(false);
      });
    }
  }, []);

  const handleFilterChange = (newTimeframe: "day" | "week" | "month" | "lifetime") => {
    // if (timeframe === newTimeframe) return; // bail if nothing changed
    setTimeframe(newTimeframe);
    setExpanded((prev) => ({
      ...prev,
      newUsers: false,
      activeUsers: false,
      topPosters: false,
      posts: false,
      top5Posts: false,
    }));
    setIsLoading(true);
    if (!vm.ErrorMessage) {
      vm.FetchDashboard(newTimeframe).finally(() => {
        setIsLoading(false);
      });
    }
  };

  if (isLoading) return <Loading message="Loading Dashboard..." />;
  if (!vm.Dashboard) return <NoData message="No Data Available" />;

  return (
    <Container className={styles.mobileContainer}>
      {/* Time Filter Buttons */}
      <div className={styles.filter}>
        <Button
          appearance={timeframe === "day" ? "primary" : "secondary"}
          className={styles.filterButton}
          size="large"
          onClick={() => handleFilterChange("day")}
        >
          Day
        </Button>
        <Button
          appearance={timeframe === "week" ? "primary" : "secondary"}
          className={styles.filterButton}
          size="large"
          onClick={() => handleFilterChange("week")}
        >
          Week
        </Button>
        <Button
          appearance={timeframe === "month" ? "primary" : "secondary"}
          className={styles.filterButton}
          size="large"
          onClick={() => handleFilterChange("month")}
        >
          Month
        </Button>
        <Button
          appearance={timeframe === "lifetime" ? "primary" : "secondary"}
          className={styles.filterButton}
          size="large"
          onClick={() => handleFilterChange("lifetime")}
        >
          Lifetime
        </Button>
      </div>

      <List>
        <ListItem className={styles.listItem}>
          <Divider>
            <Subtitle1 className={styles.title}>
              New Users <CounterBadge count={vm.Dashboard.new_users.size} size="large" showZero />
            </Subtitle1>
          </Divider>
          {!(vm.Dashboard.new_users.size > 0) ? (
            <div className={styles.noData}>
              <NoData message={"No Users"} addPadding={false} />
            </div>
          ) : (
            <>
              <Users
                users={
                  expanded.newUsers
                    ? Array.from(vm.Dashboard.new_users.values())
                    : Array.from(vm.Dashboard.new_users.values()).slice(0, 3)
                }
              />
              {vm.Dashboard.new_users.size > 3 && (
                <Button
                  className={styles.showButton}
                  onClick={() => {
                    if (expanded.newUsers)
                      setExpanded((prev) => ({
                        ...prev,
                        newUsers: false,
                      }));
                    else
                      setExpanded((prev) => ({
                        ...prev,
                        newUsers: true,
                      }));
                  }}
                  appearance="transparent"
                  icon={expanded.newUsers ? <PanelBottomExpandFilled /> : <PanelTopExpandFilled />}
                  size="large"
                >
                  {expanded.newUsers ? "Show Less" : "Show More"}
                </Button>
              )}
            </>
          )}
        </ListItem>
        <ListItem className={styles.listItem}>
          <Divider>
            <Subtitle1 className={styles.title}>
              Active Users
              <CounterBadge count={vm.Dashboard.active_users.size} size="large" showZero />
            </Subtitle1>
          </Divider>
          {!(vm.Dashboard.active_users.size > 0) ? (
            <div className={styles.showButton}>
              <NoData message={"No Users"} addPadding={false} />
            </div>
          ) : (
            <>
              <Users
                users={
                  expanded.activeUsers
                    ? Array.from(vm.Dashboard.active_users.values())
                    : Array.from(vm.Dashboard.active_users.values()).slice(0, 3)
                }
              />
              {vm.Dashboard.active_users.size > 3 && (
                <Button
                  className={styles.showButton}
                  onClick={() => {
                    if (expanded.activeUsers)
                      setExpanded((prev) => ({
                        ...prev,
                        activeUsers: false,
                      }));
                    else
                      setExpanded((prev) => ({
                        ...prev,
                        activeUsers: true,
                      }));
                  }}
                  appearance="transparent"
                  icon={expanded.activeUsers ? <PanelBottomExpandFilled /> : <PanelTopExpandFilled />}
                  size="large"
                >
                  {expanded.activeUsers ? "Show Less" : "Show More"}
                </Button>
              )}
            </>
          )}
        </ListItem>
        <ListItem className={styles.listItem}>
          <Divider>
            <Subtitle1 className={styles.title}>
              Top Posters <CounterBadge count={vm.Dashboard.top_posters.size} size="large" showZero />
            </Subtitle1>
          </Divider>
          {!(vm.Dashboard.top_posters.size > 0) ? (
            <div className={styles.showButton}>
              <NoData message={"No Users"} addPadding={false} />
            </div>
          ) : (
            <>
              <Users
                users={
                  expanded.topPosters
                    ? Array.from(vm.Dashboard.top_posters.values())
                    : Array.from(vm.Dashboard.top_posters.values()).slice(0, 3)
                }
              />
              {vm.Dashboard.top_posters.size > 3 && (
                <Button
                  className={styles.showButton}
                  onClick={() => {
                    if (expanded.topPosters)
                      setExpanded((prev) => ({
                        ...prev,
                        topPosters: false,
                      }));
                    else
                      setExpanded((prev) => ({
                        ...prev,
                        topPosters: true,
                      }));
                  }}
                  appearance="transparent"
                  icon={expanded.topPosters ? <PanelBottomExpandFilled /> : <PanelTopExpandFilled />}
                  size="large"
                >
                  {expanded.topPosters ? "Show Less" : "Show More"}
                </Button>
              )}
            </>
          )}
        </ListItem>
        <ListItem className={styles.listItem}>
          <Divider>
            <Subtitle1 className={styles.title}>
              Posts <CounterBadge count={vm.Dashboard.recent_posts.size} size="large" showZero />
            </Subtitle1>
          </Divider>
          {!(vm.Dashboard.recent_posts.size > 0) ? (
            <div className={styles.showButton}>
              <NoData message={"No Posts"} addPadding={false} />
            </div>
          ) : (
            <>
              <Posts
                posts={
                  expanded.posts
                    ? vm.Dashboard.recent_posts
                    : new Map(Array.from(vm.Dashboard.recent_posts.entries()).slice(0, 1))
                }
                disabled
              />
              {vm.Dashboard.recent_posts.size > 1 && (
                <Button
                  className={styles.showButton}
                  onClick={() => {
                    if (expanded.posts)
                      setExpanded((prev) => ({
                        ...prev,
                        posts: false,
                      }));
                    else
                      setExpanded((prev) => ({
                        ...prev,
                        posts: true,
                      }));
                  }}
                  appearance="transparent"
                  icon={expanded.posts ? <PanelBottomExpandFilled /> : <PanelTopExpandFilled />}
                  size="large"
                >
                  {expanded.posts ? "Show Less" : "Show More"}
                </Button>
              )}
            </>
          )}
        </ListItem>
        <ListItem className={styles.listItem}>
          <Divider>
            <Subtitle1 className={styles.title}>
              Top 5 Posts <CounterBadge count={vm.Dashboard.top_posts.size} size="large" showZero />
            </Subtitle1>
          </Divider>
          {!(vm.Dashboard.top_posts.size > 0) ? (
            <div className={styles.showButton}>
              <NoData message={"No Posts"} addPadding={false} />
            </div>
          ) : (
            <>
              <Posts
                posts={
                  expanded.top5Posts
                    ? vm.Dashboard.top_posts
                    : new Map(Array.from(vm.Dashboard.top_posts.entries()).slice(0, 1))
                }
                disabled
              />
              {vm.Dashboard.top_posts.size > 1 && (
                <Button
                  className={styles.showButton}
                  onClick={() => {
                    if (expanded.top5Posts)
                      setExpanded((prev) => ({
                        ...prev,
                        top5Posts: false,
                      }));
                    else
                      setExpanded((prev) => ({
                        ...prev,
                        top5Posts: true,
                      }));
                  }}
                  appearance="transparent"
                  icon={expanded.top5Posts ? <PanelBottomExpandFilled /> : <PanelTopExpandFilled />}
                  size="large"
                >
                  {expanded.top5Posts ? "Show Less" : "Show More"}
                </Button>
              )}
            </>
          )}
        </ListItem>
      </List>
    </Container>
  );
});

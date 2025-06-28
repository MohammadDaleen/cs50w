import { FormEvent, useEffect, useLayoutEffect, useState } from "react";
import { observer } from "mobx-react";
import { useVM } from "../viewModel/context";
import { Link, useParams } from "react-router-dom";
import {
  Title2,
  Button,
  makeStyles,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  tokens,
  Subtitle2,
  Subtitle1,
  mergeClasses,
} from "@fluentui/react-components";
import {
  ArrowSyncFilled,
  DeleteFilled,
  ImageAddFilled,
  LayerDiagonalFilled,
  MoreVerticalFilled,
  PeopleCommunityAddFilled,
  PersonAddFilled,
  PersonDeleteFilled,
  RibbonStarFilled,
} from "@fluentui/react-icons";
import { NoData } from "./NoData";
import { Posts } from "./Posts";
import { Loading } from "./Loading";
import InfiniteScroll from "react-infinite-scroll-component";
import { NotFound } from "./NotFound";
import { Container } from "react-bootstrap";

const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginTop: "1rem",
    marginBottom: "0.5rem",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },
  user: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "1rem",
  },
  actions: {
    display: "flex",
    flexDirection: "row",
    gap: "1rem",
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    // gap: "2rem",
  },
  footerActions: {
    display: "flex",
    flexDirection: "row",
    gap: "0.25rem",
    alignItems: "center",
  },
  link: {
    textDecoration: "none",
    color: "inherit",
  },
  dialogButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground1,
    },
  },
  profilePage: {
    border: "1px solid grey",
  },
  noData: {
    marginTop: "3rem",
    marginBottom: "3rem",
  },
});

export const ProfilePage = observer(() => {
  const styles = useStyles();
  const vm = useVM();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const params = useParams();
  // For managing profile picture removal confirmation.
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Synchronously set isLoading to true before painting
  // This is needed when visiting a ProfilePage from another ProfilePage
  useLayoutEffect(() => {
    setIsLoading(true);
  }, [params]);

  const username = params.username;

  useEffect(() => {
    if (!username) {
      vm.SetError("Couldn't get username from URL");
      setIsLoading(false);
      return;
    }
    vm.FetchProfilePage(username, 1).finally(() => {
      setIsLoading(false);
    });
  }, [params]);

  const handleFollowClick = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    if (!username) {
      vm.SetError("Couldn't get username from URL");
      setIsLoading(false);
      return;
    }
    await vm.Follow(username);
    setIsLoading(false);
    vm.forceUpdate;
  };

  // Function to fetch more posts on scroll
  const fetchMoreProfilePosts = async () => {
    if (!username) {
      vm.SetError("Couldn't get username from URL");
      setIsLoading(false);
      return;
    }
    vm.VisitedUserPostSetNumber += 1;
    await vm.FetchProfilePage(username, vm.VisitedUserPostSetNumber);
  };

  const handleUploadProfilePicture = async () => {
    const file = await vm.OpenFileExplorer();
    if (file) {
      setIsLoading(true);
      await vm.UploadProfilePicture(file);
      setIsLoading(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmRemoveProfilePicture = async () => {
    setIsLoading(true);
    await vm.RemoveProfilePicture();
    setIsLoading(false);
    setIsDeleteDialogOpen(false);
  };

  const cancelRemoveProfilePicture = () => {
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <Loading message={"Loading Profile Page..."} />;
  }
  if (!vm.VisitedUser) {
    return <NotFound />;
  }
  if (vm.ErrorMessage) {
    return <NoData />;
  }

  const isOwner = vm.User?.username === vm.VisitedUser.username;
  const isFollowing = vm.User && vm.VisitedUser.userFollowers.indexOf(vm.User.username) !== -1;

  return (
    <>
      <Container className={styles.mobileContainer}>
        <div className={styles.stack}>
          <div className={styles.header}>
            <div className={styles.user}>
              <Avatar
                {...(vm.VisitedUser.profilePicture
                  ? {
                      image: { src: vm.VisitedUser.profilePicture },
                    }
                  : { color: "colorful" })}
                className={styles.profilePage}
                name={vm.VisitedUser.username}
                shape="square"
                size={128}
                active={"active"}
                activeAppearance={"shadow"}
              />
              <Link to={`/${vm.VisitedUser.username}`} className={styles.link}>
                <Title2>{vm.VisitedUser.username}</Title2>
              </Link>
            </div>
            <div className={styles.actions}>
              {!isOwner && vm.User?.isAuthenticated && (
                <Button
                  appearance={isFollowing ? "secondary" : "primary"}
                  onClick={handleFollowClick}
                  icon={isFollowing ? <PersonDeleteFilled /> : <PersonAddFilled />}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
              {isOwner && (
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button
                      appearance={"subtle"}
                      size={"large"}
                      icon={<MoreVerticalFilled />}
                      aria-label="Profile Options"
                    />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {!vm.VisitedUser.profilePicture ? (
                        <MenuItem onClick={handleUploadProfilePicture} icon={<ImageAddFilled />}>
                          Upload Profile Picture
                        </MenuItem>
                      ) : (
                        <>
                          <MenuItem onClick={handleUploadProfilePicture} icon={<ArrowSyncFilled />}>
                            Change Profile Picture
                          </MenuItem>
                          <MenuItem onClick={handleRemoveProfilePicture} icon={<DeleteFilled />}>
                            Remove Profile Picture
                          </MenuItem>
                        </>
                      )}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              )}
            </div>
          </div>
          <div className={styles.footer}>
            <div className={styles.footerActions}>
              <LayerDiagonalFilled color={tokens.colorNeutralForeground3} fontSize={"1.5rem"} />
              <Subtitle2 style={{ color: tokens.colorNeutralForeground3 }}>Posts:</Subtitle2>
              <Subtitle1>{vm.VisitedUser.postsCount}</Subtitle1>
            </div>
            <Link
              to={`/${vm.VisitedUser.username}/followers`}
              className={mergeClasses(styles.footerActions, styles.link)}
            >
              <PeopleCommunityAddFilled color={tokens.colorNeutralForeground3} fontSize={"1.5rem"} />
              <Subtitle2 style={{ color: tokens.colorNeutralForeground3 }}>Followers:</Subtitle2>
              <Subtitle1>{vm.VisitedUser.userFollowers.length}</Subtitle1>
            </Link>
            <Link
              to={`/${vm.VisitedUser.username}/followees`}
              className={mergeClasses(styles.footerActions, styles.link)}
            >
              <RibbonStarFilled color={tokens.colorNeutralForeground3} fontSize={"1.5rem"} />
              <Subtitle2 style={{ color: tokens.colorNeutralForeground3 }}>Following:</Subtitle2>
              <Subtitle1>{vm.VisitedUser.userFollowees.length}</Subtitle1>
            </Link>
          </div>
        </div>
      </Container>

      {!vm.VisitedUserPosts || vm.VisitedUserPosts.size === 0 ? (
        <NoData message="No Posts Yet!" />
      ) : (
        <InfiniteScroll
          dataLength={vm.VisitedUserPosts.size}
          next={fetchMoreProfilePosts}
          hasMore={vm.HasMoreVisitedUserPosts}
          loader={<Loading message="Loading more posts..." />}
          endMessage={
            <div className={styles.noData}>
              <NoData message="No more posts to show." addPadding={false} />
            </div>
          }
        >
          <Container className={styles.mobileContainer}>
            <Posts posts={vm.VisitedUserPosts} />
          </Container>
        </InfiniteScroll>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={
          // @ts-ignore
          (event, data) => setIsDeleteDialogOpen(data.open)
        }
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Do You Really Want To Remove Your Profile Picture?</DialogTitle>
            <DialogActions>
              <Button
                size={"large"}
                className={styles.dialogButton}
                appearance="primary"
                onClick={confirmRemoveProfilePicture}
              >
                Yes
              </Button>
              <Button size={"large"} appearance="secondary" onClick={cancelRemoveProfilePicture}>
                No
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
});

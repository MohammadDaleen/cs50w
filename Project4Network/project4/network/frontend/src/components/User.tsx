import { useState } from "react";
import { observer } from "mobx-react-lite";
import { User } from "../types/User";
import { useVM } from "../viewModel/context";
import { Link } from "react-router-dom";
import {
  Avatar,
  Button,
  makeStyles,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  tokens,
  Body1Stronger,
  Body1,
  Card,
  CardHeader,
} from "@fluentui/react-components";
import { MoreVerticalFilled, PersonAddFilled, PersonDeleteFilled } from "@fluentui/react-icons";

const useStyles = makeStyles({
  card: {
    marginTop: "1rem",
    marginBottom: "1rem",
    width: "100%",
    border: "1px solid grey",
    borderRadius: tokens.borderRadiusLarge,
  },
  profile: {
    border: "1px solid grey",
  },
  username: {
    textDecoration: "none",
    color: "inherit",
  },
  menuButton: {
    marginLeft: "auto",
  },
  dialogButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground1,
    },
  },
});

export const UserItem = observer(({ user }: { user: User }) => {
  const styles = useStyles();
  const vm = useVM();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);

  const isFollowing = vm.User?.userFollowees.includes(user.username);

  const handleToggleFollow = async () => {
    await vm.Follow(user.username, false);
  };

  const handleUnfollowClick = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmUnfollowClick = async () => {
    await vm.Follow(user.username, false); // toggles the follow status
    setIsConfirmDialogOpen(false);
  };

  const handleCancelUnfollowClick = () => {
    setIsConfirmDialogOpen(false);
  };

  return (
    <>
      <Card className={styles.card} appearance="filled-alternative">
        <CardHeader
          image={
            <Link to={`/${user.username}`}>
              <Avatar
                {...(user.profilePicture
                  ? {
                      image: { src: user.profilePicture },
                    }
                  : { color: "colorful" })}
                className={styles.profile}
                name={user.username}
                size={48}
                active={"active"}
                activeAppearance={"shadow"}
              />
            </Link>
          }
          header={
            <Link to={`/${user.username}`} className={styles.username}>
              {/* // TODO: change to dict-like to access using username* or id* */}
              {vm.User?.userFollowees.includes(user.username) ? (
                <Body1Stronger>{user.username}</Body1Stronger>
              ) : (
                <Body1>{user.username}</Body1>
              )}
            </Link>
          }
          {...(vm.User?.username !== user.username && {
            action: (
              <div className={styles.menuButton}>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button appearance="transparent" icon={<MoreVerticalFilled />} aria-label="Options" size="large" />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {isFollowing ? (
                        <MenuItem onClick={handleUnfollowClick} icon={<PersonDeleteFilled />}>
                          Unfollow
                        </MenuItem>
                      ) : (
                        <MenuItem onClick={handleToggleFollow} icon={<PersonAddFilled />}>
                          Follow
                        </MenuItem>
                      )}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>
            ),
          })}
        />
      </Card>

      {/* Unfollow Confirmation Dialog */}
      <Dialog
        open={isConfirmDialogOpen}
        onOpenChange={
          // @ts-ignore
          (event, data) => setIsDeleteDialogOpen(data.open)
        }
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Do You Really Want To Unfollow {user.username}?</DialogTitle>
            <DialogActions>
              <Button
                size={"large"}
                className={styles.dialogButton}
                appearance="primary"
                onClick={handleConfirmUnfollowClick}
              >
                Yes
              </Button>
              <Button size={"large"} appearance="secondary" onClick={handleCancelUnfollowClick}>
                No
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
});

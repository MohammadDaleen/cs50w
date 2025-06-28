import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../viewModel/context";
import { Post } from "../types/Post";
import { Link, useNavigate } from "react-router-dom";
import {
  ChatFilled,
  CheckmarkFilled,
  DeleteFilled,
  DismissFilled,
  EditFilled,
  HeartFilled,
  HeartRegular,
  MoreVerticalFilled,
} from "@fluentui/react-icons";
import {
  Card,
  CardHeader,
  CardFooter,
  Button,
  Text,
  Textarea,
  Caption1,
  makeStyles,
  Body1,
  tokens,
  Avatar,
  CardPreview,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogActions,
  DialogTitle,
  MenuButton,
  Body1Stronger,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  card: {
    marginTop: "1rem",
    marginBottom: "1rem",
    border: "1px solid grey",
    borderRadius: tokens.borderRadiusLarge,
  },
  profilePage: {
    border: "1px solid grey",
  },
  username: {
    textDecoration: "none",
    color: "inherit",
  },
  editButtons: {
    display: "flex",
    gap: "1rem",
  },
  cardHeaderContent: {
    display: "flex",
    flexDirection: "column",
  },
  cardHeaderActions: {
    display: "flex",
    alignItems: "center",
  },
  postContent: {
    whiteSpace: "pre-wrap",
  },
  cardFooter: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "0rem",
  },
  heartFilled: {
    color: tokens.colorPaletteRedBackground3,
  },
  viewCommentsButton: { marginLeft: "auto" },
  // TODO: remove if not needed
  // deleteIcon: {
  //   color: tokens.colorPaletteRedBackground3,
  //   ":hover": {
  //     color: tokens.colorPaletteRedForeground1,
  //   },
  // },
  dialogButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground1,
    },
  },
});

export const PostItem = observer(({ post, disabled = false }: { post: Post; disabled?: boolean }) => {
  const styles = useStyles();
  const vm = useVM();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>(post.content);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // When "Edit" is clicked, enter editing mode.
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Cancel editing and revert the changes.
  const handleCancelEditClick = () => {
    setEditedContent(post.content); // Revert to original content
    setIsEditing(false);
  };

  // Save the edited content.
  const handleSaveEditClick = async () => {
    setIsLoading(true);
    // Do not allow empty content.
    if (editedContent.trim().length === 0) {
      vm.SetError("Post content cannot be empty.");
      setIsLoading(false);
      return;
    }
    // Call the VM's EditPost function, which calls CdsService.EditPost internally.
    await vm.EditPost(post.id, editedContent.trim());
    setIsEditing(false);
    setIsLoading(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteClick = async () => {
    // If we are in a PostDetail
    if (location.pathname === `/post/${post.id}`) {
      // Navigate back
      navigate(-1);
    }
    await vm.DeletePost(post.id);
  };

  const handleCancelDeleteClick = () => {
    setIsDeleteDialogOpen(false);
  };

  // Handler for navigating to the post's detail view (View Comments)
  const handleViewComments = () => {
    const destination = `/post/${post.id}`;
    // If the current path is already that post, use replace: true.
    const isSamePost = location.pathname === destination;
    navigate(destination, { replace: isSamePost });
  };

  return (
    <>
      <Card className={styles.card} appearance="filled-alternative">
        <CardHeader
          image={
            <Link to={`/${post.poster.username}`}>
              <Avatar
                {...(post.poster.profilePicture
                  ? {
                      image: { src: post.poster.profilePicture },
                    }
                  : { color: "colorful" })}
                className={styles.profilePage}
                name={post.poster.username}
                size={48}
                active={"active"}
                activeAppearance={"shadow"}
              />
            </Link>
          }
          header={
            <Link to={`/${post.poster.username}`} className={styles.username}>
              <Body1Stronger>{post.poster.username}</Body1Stronger>
            </Link>
          }
          description={<Caption1>{post.timestamp}</Caption1>}
          // Conditionally display edit action if the logged-in user is the post owner
          {...(vm.User?.username === post.poster.username && {
            action: isEditing ? (
              <div className={styles.cardHeaderActions}>
                <Button
                  onClick={handleSaveEditClick}
                  appearance="transparent"
                  icon={<CheckmarkFilled />}
                  aria-label="Save Post"
                  disabled={isLoading || disabled}
                />
                <Button
                  onClick={handleCancelEditClick}
                  appearance="transparent"
                  icon={<DismissFilled />}
                  aria-label="Cancel"
                  disabled={isLoading || disabled}
                />
              </div>
            ) : (
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <MenuButton
                    size={"large"}
                    appearance="transparent"
                    icon={<MoreVerticalFilled />}
                    aria-label="Options"
                    disabled={disabled}
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem onClick={handleEditClick} icon={<EditFilled />}>
                      Edit
                    </MenuItem>
                    <MenuItem onClick={handleDeleteClick} icon={<DeleteFilled />}>
                      Delete
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            ),
          })}
        />
        {isEditing ? (
          <Textarea
            appearance="filled-darker"
            size="large"
            value={editedContent}
            // @ts-ignore
            onChange={(e, data) => setEditedContent(data.value || "")}
            disabled={isLoading}
            rows={4}
            style={{ width: "100%" }}
          />
        ) : (
          <Text className={styles.postContent}>{post.content}</Text>
        )}
        {post.image && (
          <CardPreview>
            <img src={post.image} alt="Attached" style={{ maxWidth: "100%", height: "auto" }} loading="lazy" />
          </CardPreview>
        )}
        <CardFooter className={styles.cardFooter}>
          <Button
            appearance="transparent"
            size="large"
            onClick={async () => await vm.ToggleLike(post.id)}
            icon={post.isLiked ? <HeartFilled className={styles.heartFilled} /> : <HeartRegular />}
            disabled={disabled}
          />
          <Body1>{post.postLikes}</Body1>
          <Button
            appearance="transparent"
            size="large"
            className={styles.viewCommentsButton}
            onClick={handleViewComments}
            aria-label="View Comments"
            icon={<ChatFilled />}
          />
        </CardFooter>
      </Card>

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
            <DialogTitle>Do You Really Want To Delete This Post?</DialogTitle>
            <DialogActions>
              <Button
                size={"large"}
                className={styles.dialogButton}
                appearance="primary"
                onClick={handleConfirmDeleteClick}
              >
                Yes
              </Button>
              <Button size={"large"} appearance="secondary" onClick={handleCancelDeleteClick}>
                No
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
});

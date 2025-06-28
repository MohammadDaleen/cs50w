import { observer } from "mobx-react-lite";
import { Card, CardHeader, Text, Caption1, Avatar, makeStyles, tokens } from "@fluentui/react-components";
import { Comment } from "../types/Comment"; // Ensure this type exists
import { Link } from "react-router-dom";

const useStyles = makeStyles({
  commentCard: {
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
});

export const CommentItem = observer(({ comment }: { comment: Comment }) => {
  const styles = useStyles();
  return (
    <Card className={styles.commentCard} appearance="filled-alternative">
      <CardHeader
        // Display the commenter's avatar and username
        image={
          <Link to={`/${comment.commenter.username}`}>
            <Avatar
              {...(comment.commenter.profilePicture
                ? {
                    image: { src: comment.commenter.profilePicture },
                  }
                : { color: "colorful" })}
              className={styles.profilePage}
              name={comment.commenter.username}
              active={"active"}
              activeAppearance={"shadow"}
              size={48}
            />
          </Link>
        }
        header={
          <Link to={`/${comment.commenter.username}`} className={styles.username}>
            <Text>
              <strong>{comment.commenter.username}</strong>
            </Text>
          </Link>
        }
        description={<Caption1>{comment.timestamp}</Caption1>}
      />
      <Text>{comment.content}</Text>
    </Card>
  );
});

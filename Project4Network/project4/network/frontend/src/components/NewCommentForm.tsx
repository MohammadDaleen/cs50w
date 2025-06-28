import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea, Button, makeStyles, Card, CardFooter, CardPreview, tokens } from "@fluentui/react-components";
import { useVM } from "../viewModel/context";
import { Loading } from "./Loading";
import { SendFilled } from "@fluentui/react-icons";

const useStyles = makeStyles({
  form: {
    marginTop: "1rem",
    marginBottom: "1rem",
  },
  card: {
    border: "1px solid grey",
    borderRadius: tokens.borderRadiusLarge,
  },
  footer: {
    marginLeft: "auto",
  },
});

export const NewCommentForm = observer(({ postId }: { postId: number }) => {
  const styles = useStyles();
  const vm = useVM();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length === 0) return;
    setIsLoading(true);
    // Call the VM method to post a comment.
    await vm.PostComment(postId, content.trim());
    setContent("");
    setIsLoading(false);
  };

  if (isLoading) return <Loading message="Posting comment..." />;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Card className={styles.card} appearance="filled-alternative">
        <CardPreview>
          <Textarea
            appearance="filled-darker"
            size="large"
            placeholder="Write a comment..."
            value={content}
            // @ts-ignore
            onChange={(e, data) => setContent(data.value || "")}
            required
            rows={3}
          />
        </CardPreview>
        <CardFooter className={styles.footer}>
          <Button icon={<SendFilled />} type="submit" appearance="primary" disabled={content.trim().length === 0} />
        </CardFooter>
      </Card>
    </form>
  );
});

import { useState, FormEvent, KeyboardEvent } from "react";
import { observer } from "mobx-react-lite";
import { Textarea, Button, makeStyles, Card, Image, CardPreview, CardFooter, tokens } from "@fluentui/react-components";
import { ImageAddFilled } from "@fluentui/react-icons";
import { useVM } from "../viewModel/context";
import { Loading } from "./Loading";

const useStyles = makeStyles({
  root: {
    margin: "0 auto",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    // marginBottom: "1rem",
    marginTop: "1rem",
  },
  card: {
    border: "1px solid grey",
    borderRadius: tokens.borderRadiusLarge,
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export const NewPostForm = observer(() => {
  const styles = useStyles();
  const vm = useVM();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [post, setPost] = useState<{
    content: string;
    imageFile: File | undefined;
    imageUrl: string | undefined;
  }>({
    content: "",
    imageFile: undefined,
    imageUrl: undefined,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (post.content.trim().length === 0) return;
    setIsLoading(true);
    await vm.Post(post.content.trim(), post.imageFile);
    setPost((prevState) => ({
      ...prevState,
      content: "",
      imageFile: undefined,
      imageUrl: undefined,
    }));
    setIsLoading(false);
  };

  const handleAttachImage = async () => {
    const file = await vm.OpenFileExplorer();
    setPost((prevState) => ({
      ...prevState,
      imageFile: file,
      imageUrl: file ? URL.createObjectURL(file) : undefined,
    }));
  };

  // Allow Enter (without Shift) to submit while allowing Shift+Enter for newlines.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  if (isLoading) return <Loading message={"Publishing Post..."} />;

  return (
    // <Container style={{ padding: 0 }}>
    <form onSubmit={handleSubmit} className={styles.root}>
      <Card appearance="filled-alternative" className={styles.card}>
        <CardPreview>
          <Textarea
            appearance="filled-darker"
            size="large"
            placeholder="What's happening?!"
            value={post.content}
            // @ts-ignore
            onChange={(e, data) => {
              setPost((prevState) => ({
                ...prevState,
                content: data.value || "",
              }));
            }}
            onKeyDown={handleKeyDown}
            required
            rows={8}
          />
        </CardPreview>
        <CardFooter className={styles.footer}>
          <Button size="large" type="submit" appearance="primary" disabled={post.content.trim().length === 0}>
            Publish
          </Button>
          <Button
            onClick={() => handleAttachImage()}
            icon={
              post.imageFile ? (
                <Image
                  shape="rounded"
                  src={post.imageUrl}
                  // TODO: Remove if not needed
                  // height={"36rem"}
                  // width={"36rem"}
                  fit="contain"
                />
              ) : (
                <ImageAddFilled />
              )
            }
            appearance="subtle"
            size="large"
            // style={{ marginLeft: "auto" }}
          />
        </CardFooter>
      </Card>
    </form>
  );
});

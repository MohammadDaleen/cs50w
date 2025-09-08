import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  Label,
  Input,
  DialogActions,
  Button,
  DialogTrigger,
  Card,
  makeStyles,
} from "@fluentui/react-components";
import { AddFilled } from "@fluentui/react-icons";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { useVM } from "../../viewModel/context";
import { LoadingCover } from "../LoadingCover";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  card: {
    border: "1px solid grey",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    height: "130px",
  },
});

/** DocumentCreator component */
export const DocumentCreator = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorIndices, setErrorIndices] = useState<number[]>([]);

  // Cleanup errors on unmount
  useEffect(() => {
    return () => errorIndices.forEach((index) => vm.DismissError(index));
  }, [errorIndices]);

  async function handleCreate() {
    setLoading(true);
    const errorId = await vm.CreateDocument(name.trim(), description.trim());
    if (errorId) setErrorIndices((prev) => [...prev, errorId]);
    // Clear if no errors
    if (!errorId) {
      setName("");
      setDescription("");
    }
    setLoading(false);
    setOpen(false); // close dialog
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(_ev: unknown, data?: { open?: boolean }) => setOpen(Boolean(data?.open))}
      {...(loading ? { modalType: "alert" } : {})}
    >
      <DialogTrigger>
        <Card className={styles.card} appearance="filled-alternative">
          <Button size="large" appearance="transparent" icon={<AddFilled />} onClick={() => setOpen(true)}>
            New
          </Button>
        </Card>
      </DialogTrigger>
      <DialogSurface>
        <LoadingCover loading={loading}>
          <DialogTitle>Create document</DialogTitle>
          <DialogContent>
            <Label htmlFor="name-input">Name</Label>
            <Input
              id="name-input"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
            <Label htmlFor="description-input">Description</Label>
            <Input
              id="description-input"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleCreate} disabled={!name.trim()}>
              Create
            </Button>
          </DialogActions>
        </LoadingCover>
      </DialogSurface>
    </Dialog>
  );
});

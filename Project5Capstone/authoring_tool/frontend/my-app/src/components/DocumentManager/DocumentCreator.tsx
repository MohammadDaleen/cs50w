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
  tokens,
  Textarea,
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
    alignItems: "center",
    width: "100%",
    // Ensure the card takes the full height of its grid cell.
    height: "100%",
    minHeight: "130px", // Maintain a minimum height for consistency.
  },
  // Style for the DialogContent to layout the fields
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalL,
  },
  // Style for an individual field (Label + Input)
  field: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXXS,
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
    if (errorId) {
      setErrorIndices((prev) => [...prev, errorId]);
    } else {
      // Clear if no errors
      setName("");
      setDescription("");
      setOpen(false); // close dialog on success
    }
    setLoading(false);
  }

  // Handle dialog close and reset state
  const handleOpenChange = (_ev: unknown, data?: { open?: boolean }) => {
    const isOpen = Boolean(data?.open);
    setOpen(isOpen);
    if (!isOpen) {
      // Reset fields when closing
      setName("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} {...(loading ? { modalType: "alert" } : {})}>
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
          <DialogContent className={styles.dialogContent}>
            <div className={styles.field}>
              <Label htmlFor="name-input" required>
                Name
              </Label>
              <Input
                id="name-input"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Enter a document name"
              />
            </div>
            <div className={styles.field}>
              <Label htmlFor="description-input">Description</Label>
              <Textarea
                id="description-input"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                resize="vertical" // Allow vertical resize
                placeholder="(Optional) Enter a brief description"
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
            <Button appearance="primary" disabled={!name.trim() || loading} type="submit" onClick={handleCreate}>
              Create
            </Button>
          </DialogActions>
        </LoadingCover>
      </DialogSurface>
    </Dialog>
  );
});

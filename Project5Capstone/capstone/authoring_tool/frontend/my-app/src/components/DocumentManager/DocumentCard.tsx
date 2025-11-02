import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  Label,
  Input,
  DialogActions,
  Textarea,
  Card,
  Button,
  CardFooter,
  makeStyles,
  mergeClasses,
  Tooltip,
  Tag,
  CounterBadge,
  shorthands,
} from "@fluentui/react-components";
import {
  Delete16Regular,
  MoreHorizontal16Regular,
  EditFilled,
  RenameARegular,
  SlideTextEditRegular,
  ShiftsAddRegular,
} from "@fluentui/react-icons";
import { Text } from "@fluentui/react-text";
import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Doc } from "../../types";
import { useVM } from "../../viewModel/context";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  card: {
    border: "1px solid grey",
    // Ensure the card takes the full height of its grid cell.
    height: "100%",
  },
  // Style for form content inside dialogs
  dialogForm: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "20px",
  },
  // Specific style for the delete confirmation form
  deleteDialogForm: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "20px",
    marginTop: "12px",
  },
  // Style for the delete button (danger)
  deleteButton: {
    backgroundColor: "#c62828",
    color: "white",
    ...shorthands.borderColor("#c62828"),
    // Add hover and active styles
    ":hover": {
      backgroundColor: "#b71c1c",
      ...shorthands.borderColor("#b71c1c"),
      color: "white",
    },
    ":active": {
      backgroundColor: "#9a1515",
      ...shorthands.borderColor("#9a1515"),
      color: "white",
    },
  },
});

/** DocumentCard component */
export const DocumentCard = observer(({ doc }: { doc: Doc }) => {
  const vm = useVM();
  const styles = useStyles();
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(false);
  const [describing, setDescribing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);
  const [name, setName] = useState(doc.name);
  const [description, setDescription] = useState(doc.description);
  // State for the delete confirmation input
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  useEffect(() => {
    setName(doc.name);
    setDescription(doc.description);
  }, [doc.name, doc.description]);

  // Helper to reset delete confirmation when dialog closes
  const handleCloseDeleteDialog = () => {
    setConfirmDelete(false);
    setDeleteConfirmName(""); // Reset confirmation text
  };

  return (
    <Card
      className={styles.card}
      appearance="filled-alternative"
      style={{ padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {doc.name}
          </div>
          <div style={{ marginTop: 6, color: "#666", fontSize: 13, minHeight: 36, overflow: "hidden" }}>
            {doc.description || <span style={{ opacity: 0.6 }}>No description</span>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <Tooltip content="Edit Document" relationship="label">
            <Button appearance="subtle" icon={<EditFilled />} onClick={() => navigate(`document/${doc.id}`)} />
          </Tooltip>

          <Menu>
            <MenuTrigger>
              <Button appearance="subtle" icon={<MoreHorizontal16Regular />} />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => setRenaming(true)} icon={<RenameARegular />}>
                  Rename
                </MenuItem>
                <MenuItem onClick={() => setDescribing(true)} icon={<SlideTextEditRegular />}>
                  Update description
                </MenuItem>
                <MenuItem onClick={() => setConfirmDelete(true)} icon={<Delete16Regular />}>
                  Delete
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>

      <CardFooter>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <Text>
            <span style={{ opacity: 0.7 }}>{"Nodes: "}</span>
            <CounterBadge count={doc.content_node_count} color={"informative"}></CounterBadge>
          </Text>
          <Text>
            <Tag icon={<ShiftsAddRegular style={{ opacity: 0.7 }} />} appearance={"filled"}>
              <span style={{ opacity: 0.7 }}>{`${doc.timestamp.toLocaleString()}`}</span>
            </Tag>
          </Text>
        </div>
      </CardFooter>

      {/* Rename dialog */}
      <Dialog
        open={renaming}
        onOpenChange={(_ev: unknown, data?: { open?: boolean }) => {
          setRenaming(Boolean(data?.open));
        }}
      >
        <DialogSurface>
          <DialogTitle>Rename document</DialogTitle>
          {/* Rename dialog content */}
          <DialogContent>
            <div className={styles.dialogForm}>
              <Label htmlFor="rename-input">Name</Label>
              <Input
                id="rename-input"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={async () => {
                setWorking(true);
                const updatedDoc: Partial<Doc> = { name: name };
                await vm.UpdateDocument(doc.id, updatedDoc);
                setRenaming(false);
                setWorking(false);
              }}
              disabled={working || !name}
            >
              Save
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Describe dialog */}
      <Dialog
        open={describing}
        onOpenChange={(_ev: unknown, data?: { open?: boolean }) => {
          setDescribing(Boolean(data?.open));
        }}
      >
        <DialogSurface>
          <DialogTitle>Update description</DialogTitle>
          {/* Describe dialog content */}
          <DialogContent>
            <div className={styles.dialogForm}>
              <Label htmlFor="description-textarea">Description</Label>
              <Textarea
                id="description-textarea"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                resize="vertical" // Allow vertical resize
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setDescribing(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={async () => {
                setWorking(true);
                const updatedDoc: Partial<Doc> = { description: description };
                await vm.UpdateDocument(doc.id, updatedDoc);
                setDescribing(false);
                setWorking(false);
              }}
              disabled={working}
            >
              Save
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmDelete}
        onOpenChange={(_ev: unknown, data?: { open?: boolean }) => {
          if (!data?.open) handleCloseDeleteDialog(); // Reset state on close
          setConfirmDelete(Boolean(data?.open));
        }}
      >
        <DialogSurface>
          <DialogTitle>Delete document</DialogTitle>
          <DialogContent>
            <Text>
              Deleting this document is permanent. Type the document name <Text weight="semibold">{doc.name}</Text> to
              confirm deletion.
            </Text>
            <div className={styles.deleteDialogForm}>
              <Label htmlFor="delete-confirm-input">Document name</Label>
              <Input
                id="delete-confirm-input"
                placeholder={doc.name}
                value={deleteConfirmName} // Bind to state
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDeleteConfirmName(e.target.value); // Update state on change
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={async () => {
                setWorking(true);
                await vm.DeleteDocument(doc.id);
                handleCloseDeleteDialog();
                setWorking(false);
              }}
              disabled={working || deleteConfirmName !== doc.name}
              className={mergeClasses(deleteConfirmName === doc.name && styles.deleteButton)}
            >
              Delete
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </Card>
  );
});

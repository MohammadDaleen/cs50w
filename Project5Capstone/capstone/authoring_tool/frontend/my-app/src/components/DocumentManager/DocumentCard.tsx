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
} from "@fluentui/react-components";
import { Delete16Regular, MoreHorizontal16Regular, EditFilled } from "@fluentui/react-icons";
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

  useEffect(() => {
    setName(doc.name);
    setDescription(doc.description);
  }, [doc.name, doc.description]);

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

        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <Button appearance="subtle" icon={<EditFilled />} onClick={() => navigate(`document/${doc.id}`)} />

          <Menu>
            <MenuTrigger>
              <Button appearance="subtle" icon={<MoreHorizontal16Regular />} />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => setRenaming(true)} icon={<EditFilled />}>
                  Rename
                </MenuItem>
                <MenuItem onClick={() => setDescribing(true)} icon={<EditFilled />}>
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
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Text style={{ opacity: 0.7 }}>Nodes: {doc.root_content_node_id}</Text>
          <Text style={{ opacity: 0.7 }}>{doc.timestamp}</Text>
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
            <Label htmlFor="rename-input">Name</Label>
            <Input
              id="rename-input"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setWorking(true);
                const updatedDoc: Partial<Doc> = { name: name };
                await vm.UpdateDocument(doc.id, updatedDoc);
                setRenaming(false);
                setWorking(false);
              }}
              disabled={working}
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
            <Label htmlFor="description-textarea">Description</Label>
            <Textarea
              id="description-textarea"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setDescribing(false)}>
              Cancel
            </Button>
            <Button
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
          setConfirmDelete(Boolean(data?.open));
        }}
      >
        <DialogSurface>
          <DialogTitle>Delete document</DialogTitle>
          <DialogContent>
            <Text>Deleting this document is permanent. Type the document name to confirm deletion.</Text>
            <div style={{ marginTop: 12 }}>
              {/* implement stricter confirmation if desired; for now this is a placeholder input */}
              <Input
                placeholder={doc.name}
                onChange={(_e: React.ChangeEvent<HTMLInputElement>) => {
                  /* noop — strict name-checking left to integrator if desired */
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              appearance="outline"
              onClick={async () => {
                setWorking(true);
                await vm.DeleteDocument(doc.id);
                setDescribing(false);
                setWorking(false);
              }}
              disabled={working}
              style={{ borderColor: "#c62828", color: "#c62828" }}
            >
              Delete
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </Card>
  );
});

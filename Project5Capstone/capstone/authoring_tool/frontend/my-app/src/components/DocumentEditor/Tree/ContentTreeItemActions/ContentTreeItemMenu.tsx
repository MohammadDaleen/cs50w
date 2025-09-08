import { useState } from "react";
import {
  Menu,
  MenuTrigger,
  MenuButton,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogSurface,
  DialogTitle,
  makeStyles,
  tokens,
  Tooltip,
} from "@fluentui/react-components";
import { AddFilled, SquareAddRegular, EditFilled, DeleteFilled, MoreVerticalFilled } from "@fluentui/react-icons";
import { observer } from "mobx-react";
import type { Content } from "../../../../types";
import { useVM } from "../../../../viewModel/context";

const useStyles = makeStyles({
  dialogButton: {
    backgroundColor: tokens.colorPaletteRedForeground3,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground1,
    },
  },
});

export const ContentTreeItemMenu = observer(
  ({ record, level, subtreeLevel }: { record: Content; level: string; subtreeLevel: number }) => {
    const vm = useVM();
    const styles = useStyles();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

    // A child can be added to this record, if it has no childen
    const canAddChild = !record.children || record.children.length === 0;

    return (
      <>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip relationship="label" withArrow content={vm.IsEditMode ? "Disabled (Edit Mode)" : "Actions Menu"}>
              <MenuButton
                appearance="transparent"
                icon={<MoreVerticalFilled />}
                onClick={(e) => e.stopPropagation()}
                disabled={vm.IsEditMode}
              />
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                icon={<EditFilled />}
                onClick={(e) => {
                  e.stopPropagation();
                  vm.SelectedNode = { ...record, attachments: {} }; // Select the node of this content record
                  if (subtreeLevel >= 8) vm.DrawerSize = "full";
                  vm.CurrentFormSubTreeLevel = subtreeLevel;
                  vm.OpenEditContentForm(record);
                }}
              >
                Edit
              </MenuItem>
              <MenuItem
                icon={<DeleteFilled />}
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
              >
                Delete
              </MenuItem>
              <MenuItem
                icon={<AddFilled />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (subtreeLevel >= 8) vm.DrawerSize = "full";
                  vm.OpenNewContentForm(record, record.treeLevel);
                  vm.UpdateOpenBranch(level, record.id, true);
                }}
              >
                {`Add Chapter`}
              </MenuItem>
              {canAddChild && (
                <MenuItem
                  icon={<SquareAddRegular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (subtreeLevel + 1 >= 8) vm.DrawerSize = "full";
                    // Ensure a child node form doesn't exist under current record
                    if (!(vm.ContentNodeBefore === record && vm.FormTreeLevel === record.treeLevel + 1)) {
                      vm.OpenNewContentForm(record, record.treeLevel + 1); // Open a new child form
                      vm.UpdateOpenBranch(level, record.id); // Open this branch to show new child form
                    } else {
                      vm.CloseNewContentForm(); // Close the child form
                      vm.UpdateOpenBranch(level, record.id, true); // Close this empty branch
                    }
                  }}
                >
                  {`Add Sub-Chapter`}
                </MenuItem>
              )}
            </MenuList>
          </MenuPopover>
        </Menu>

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
              <DialogTitle>{`Do You Really Want to Delete This Chapter?`}</DialogTitle>
              <DialogActions>
                <Button
                  size={"medium"}
                  className={styles.dialogButton}
                  appearance="primary"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await vm.DeleteContentNode(record);
                  }}
                >
                  Yes
                </Button>
                <Button size={"medium"} appearance="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
                  No
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </>
    );
  }
);

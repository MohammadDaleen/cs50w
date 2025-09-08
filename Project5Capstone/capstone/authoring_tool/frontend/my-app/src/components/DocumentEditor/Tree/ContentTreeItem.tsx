import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogSurface,
  DialogTitle,
  makeStyles,
  tokens,
  Tooltip,
  Tree,
  TreeItem,
  type TreeItemOpenChangeData,
  type TreeItemOpenChangeEvent,
  treeItemLevelToken,
  useSubtreeContext_unstable,
  Spinner,
} from "@fluentui/react-components";
import { observer } from "mobx-react";
import { CounterBadge } from "@fluentui/react-components";
import { useState } from "react";
import { useVM } from "../../../viewModel/context";
import type { Content } from "../../../types";
import { ContentTreeItemMenu, ReorderContentActions } from "./ContentTreeItemActions";
import { EditContentFormAction, NewContentTreeItem } from "./ContentTreeItemForms";
import { ContentTreeItemChildren, ContentTreeItemLayout } from ".";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  dialogButton: {
    backgroundColor: tokens.colorPaletteRedForeground3,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground1,
    },
  },
});

export const ContentTreeItem = observer(({ record, level }: { record: Content; level: string }) => {
  const vm = useVM();
  const styles = useStyles();
  const { level: subtreeLevel } = useSubtreeContext_unstable();
  const [isChangeNodeDialogOpened, setIsChangeNodeDialogOpened] = useState(false);

  const isOpen = vm.OpenBranchState[level] && vm.OpenBranchState[level].has(record.id);

  const badge = record.children ? (
    <Tooltip relationship="label" withArrow content={(record.children?.length ?? 0) + " Items"}>
      <CounterBadge size="small" color="brand" count={record.children?.length ?? 0} />
    </Tooltip>
  ) : null;

  const menu = <ContentTreeItemMenu record={record} level={level} subtreeLevel={subtreeLevel} />;

  const aside = vm.IsResequencingMode ? (
    // Render the actions for reordering the content, if it is the resequencing mode
    <ReorderContentActions record={record} />
  ) : vm.EditNode?.id === record.id ? (
    // Render the edit node form action, if the record is chose to be edited
    <EditContentFormAction record={record} />
  ) : (
    // Display the badge and the regular actions menu
    <>
      {badge}
      {menu}
    </>
  );

  const handleOpenChange = (_: TreeItemOpenChangeEvent, data: TreeItemOpenChangeData) => {
    const sameNode = record.id === vm.SelectedNode?.id;
    // 1. If clicking the selected node,
    if (sameNode) {
      // just toggle open state (expand/collapse), no dialog
      updateOpenBranch(data.open);
      return;
    } else {
      // 2. the clicked node is different
      // and the content is dirty
      if (vm.IsDirty) {
        setIsChangeNodeDialogOpened(true); // show the discard confirmation dialog
        return; // do not change the selection or open state yet
      } else {
        // 3. If the content is clean and a different node is clicked,
        // toggle open state and update the selection
        updateOpenBranch(data.open);
        vm.SelectedNode = { ...record, attachments: {} };
      }
    }
  };

  const updateOpenBranch = (isBranchOpen: boolean) => {
    if (isBranchOpen) vm.UpdateOpenBranch(level, record.id); // Open this branch
    else vm.UpdateOpenBranch(level, record.id, true); // Close this branch and its descendants
  };

  const shouldShowBranch = () => {
    const hasChildren = record.children && record.children.length > 0;
    const hasChildForm = vm.ContentNodeBefore === record && vm.FormTreeLevel === record.treeLevel + 1;
    return hasChildren || hasChildForm;
  };

  return (
    <>
      <TreeItem
        key={record.id}
        value={record.id}
        style={{ [treeItemLevelToken]: subtreeLevel }}
        itemType={
          // Branch if there are children or new child form
          shouldShowBranch() ? "branch" : "leaf"
        }
        open={isOpen} // Dynamically set initial open state
        onOpenChange={handleOpenChange}
      >
        <ContentTreeItemLayout content={record} aside={aside} />
        {/* Render a sub section in case of it being open, and having children or a new child form */}
        {isOpen && shouldShowBranch() && (
          <Tree>
            {/* Render children records, if exist */}
            {record.children && record.children.length > 0 && (
              <ContentTreeItemChildren content={record} level={level + 1} />
            )}
            {/* Render the new child form, if the record is the parent of the form, and the form of type record.child */}
            {vm.ContentNodeBefore === record && vm.FormTreeLevel === record.treeLevel + 1 && <NewContentTreeItem />}
          </Tree>
        )}
      </TreeItem>
      {vm.IsEditMode && (
        <Dialog open={isChangeNodeDialogOpened}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Do You Really Want To Discard The Unsaved Changes?</DialogTitle>
              <DialogActions fluid>
                <Button
                  appearance="primary"
                  disabled={vm.IsContentLoading}
                  onClick={async () => {
                    await vm.SaveEditorContent(); // Save content changes
                    await vm.FetchChapterContents(true); // refetch chapter contents to reflect changes in view mode
                    setIsChangeNodeDialogOpened(false); // close dialog
                    // Update the selection and open state after the user confirms
                    updateOpenBranch(true); // change the open state
                    vm.SelectedNode = { ...record, attachments: {} }; // set the new selected node
                  }}
                >
                  {vm.IsContentLoading ? <Spinner size="tiny" /> : "Save Changes"}
                </Button>
                <Button
                  appearance="primary"
                  className={styles.dialogButton}
                  disabled={vm.IsContentLoading}
                  onClick={() => {
                    vm.IsDirty = false; // discard changes
                    setIsChangeNodeDialogOpened(false); // close dialog
                    // Update the selection and open state after the user confirms
                    updateOpenBranch(true); // change the open state
                    vm.SelectedNode = { ...record, attachments: {} }; // set the new selected node
                  }}
                >
                  Yes
                </Button>
                <Button
                  appearance="secondary"
                  disabled={vm.IsContentLoading}
                  onClick={() => setIsChangeNodeDialogOpened(false)}
                >
                  No
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
      {/* Render the new same level node form, if the record is before the form, and both are of same type */}
      {vm.ContentNodeBefore === record && vm.FormTreeLevel === record.treeLevel && <NewContentTreeItem />}
    </>
  );
});

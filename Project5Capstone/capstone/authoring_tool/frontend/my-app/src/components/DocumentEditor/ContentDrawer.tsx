import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  makeStyles,
  shorthands,
  Spinner,
  Subtitle2,
  Title3,
  tokens,
  ToolbarButton,
  Tooltip,
  useRestoreFocusSource,
} from "@fluentui/react-components";
import {
  ArrowMinimizeVerticalFilled,
  AutoFitHeightFilled,
  CheckmarkFilled,
  DismissFilled,
  FullScreenMaximizeFilled,
  FullScreenMinimizeFilled,
  ListBarTreeOffsetFilled,
  PanelLeftExpandFilled,
  PanelRightExpandFilled,
  PenFilled,
  PenOffFilled,
  TextAlignJustifyFilled,
} from "@fluentui/react-icons";
import { observer } from "mobx-react";
import { useState } from "react";
import { useVM } from "../../viewModel/context";
import { ContentEditor } from "./Editor";
import { LoadingCover, NoData } from "..";
import { ContentTree, ExpandableText, TreeMenuButton } from "./Tree";
import { ContentViewer } from "./Viewer";
import { useMediaQuery } from "../../hooks/useMediaQuery";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  root: {
    flex: "1" /* Allow the content to grow and fill the remaining space */,
    minHeight: "0" /* Ensure scrolling when content overflows */,
    overflow: "hidden",
    position: "relative",
    display: "flex",
    width: "100%",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  // Inner drawer for the content tree.
  treeDrawer: {
    position: "relative", // this is needed so we can use the loading cover
  },
  header: {
    display: "flex",
    justifyContent: "flex-end", // Align buttons to the right.
  },
  drawerHeader: {
    ...shorthands.padding("4px", "12px", "8px", "10px"),
  },
  drawerBody: {
    ...shorthands.padding("0px", "0px", "0px", "0px"),
  },
  drawerHeaderTitleHeading: {
    width: "100%",
  },
  referenceID: {
    color: tokens.colorNeutralForeground3,
  },
  // Main content area (editor/viewer).
  content: {
    width: "100%",
    display: "flex",
    justifyContent: "start",
    alignItems: "start",
  },
  // Utility to hide elements.
  hide: {
    display: "none",
  },
  dialogButton: {
    backgroundColor: tokens.colorPaletteRedForeground3,
    ":hover": {
      backgroundColor: tokens.colorPaletteRedForeground1,
    },
  },
});

/**
 * ContentDrawer Component
 * Provides a drawer to display the content tree and content viewer.
 * The drawer can toggle between open/close states and supports resizing.
 */
export const ContentDrawer = observer(() => {
  const vm = useVM(); // Access the ViewModel from context
  const styles = useStyles(); // Get the defined styles
  const [isDrawerOpen, setIsDrawerOpen] = useState(true); // For desktop view only
  const [isToggleEditModeDialogOpened, setIsToggleEditModeDialogOpened] = useState(false);
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const isMobile = useMediaQuery();

  if (!vm.Records.length) return <NoData />;

  // On mobile, show the tree view. Otherwise, show the desktop layout.
  const showTreeView = isMobile ? vm.MobileView === "tree" : isDrawerOpen;
  // On mobile, show the content view. Otherwise, show it based on desktop layout rules.
  const showContentView = isMobile ? vm.MobileView === "content" : vm.DrawerSize === "medium";

  return (
    <div className={styles.root}>
      {/* This Drawer is for the content tree. Its visibility is controlled differently on mobile vs. desktop. */}
      <Drawer
        {...restoreFocusSourceAttributes}
        className={showTreeView ? styles.treeDrawer : styles.hide}
        type="inline"
        separator
        size={isMobile ? "full" : vm.DrawerSize} // Always full screen on mobile when visible
        open={showTreeView} // Controlled by responsive state
        onOpenChange={(_, { open }) => !isMobile && setIsDrawerOpen(open)}
      >
        <LoadingCover loading={vm.AreChapterContentFilesLoading || vm.IsNodeContentFileLoading || vm.IsContentSaving}>
          <DrawerHeader className={styles.drawerHeader}>
            <DrawerHeaderTitle
              heading={{ as: "div", className: styles.drawerHeaderTitleHeading }}
              action={
                <div className={styles.header}>
                  {/* Button to expand/collapse all nodes in the tree */}
                  <Tooltip
                    withArrow
                    relationship="label"
                    content={
                      vm.HasOpenBranchesExceptSelected
                        ? "Collapse All".concat(vm.SelectedNode ? " (Except Selected)" : "")
                        : "Expand All"
                    }
                  >
                    <ToolbarButton
                      aria-label="Expand/Collapse All"
                      appearance="subtle"
                      icon={
                        vm.HasOpenBranchesExceptSelected ? <ArrowMinimizeVerticalFilled /> : <AutoFitHeightFilled />
                      }
                      onClick={() => {
                        if (vm.HasOpenBranchesExceptSelected) vm.CollapseAll();
                        else vm.ExpandAll(); // Expand all branches
                      }}
                    />
                  </Tooltip>
                  {/* Button to toggle between edit and view modes */}
                  {vm.CanUserEdit &&
                    (vm.SelectedChapter || vm.SelectedNode?.htmlContent) &&
                    !vm.IsContentLoading &&
                    !vm.IsResequencingMode &&
                    vm.Records[0].children &&
                    vm.Records[0].children.length > 0 && (
                      <Tooltip
                        withArrow
                        relationship="label"
                        content={(vm.IsEditMode === true ? "Exit Edit Mode" : "Enter Edit Mode").concat(
                          vm.IsDirty ? " (Unsaved Changes)" : ""
                        )}
                      >
                        <ToolbarButton
                          aria-label="Toggle Edit Mode"
                          appearance="subtle"
                          icon={vm.IsEditMode ? <PenOffFilled /> : <PenFilled />}
                          onClick={() => {
                            if (vm.IsDirty) setIsToggleEditModeDialogOpened(true);
                            else vm.ToggleEditMode();
                          }}
                        />
                      </Tooltip>
                    )}
                  {vm.IsEditMode && (
                    <Dialog open={isToggleEditModeDialogOpened}>
                      <DialogSurface>
                        <DialogBody>
                          <DialogTitle>Do You Really Want To Discard The Unsaved Changes?</DialogTitle>
                          <DialogActions fluid>
                            <Button
                              appearance="primary"
                              disabled={vm.IsContentLoading}
                              onClick={async () => {
                                await vm.SaveEditorContent(); // Save content changes
                                setIsToggleEditModeDialogOpened(false); // close dialog
                                // toggle the edit mode, implicitly refetch chapter contents to reflect changes in view mode
                                vm.ToggleEditMode();
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
                                setIsToggleEditModeDialogOpened(false); // close dialog
                                vm.ToggleEditMode(); // toggle the edit mode
                              }}
                            >
                              Yes
                            </Button>
                            <Button
                              appearance="secondary"
                              disabled={vm.IsContentLoading}
                              onClick={() => setIsToggleEditModeDialogOpened(false)}
                            >
                              No
                            </Button>
                          </DialogActions>
                        </DialogBody>
                      </DialogSurface>
                    </Dialog>
                  )}
                  {/* Button to toggle resequencing and view modes */}
                  {vm.CanUserEdit &&
                    !vm.IsEditMode &&
                    !vm.IsContentLoading &&
                    vm.Records[0].children &&
                    vm.Records[0].children.length > 0 && (
                      <Tooltip
                        withArrow
                        content={vm.IsResequencingMode === true ? "Save Changes" : "Enter Resequencing Mode"}
                        relationship="label"
                      >
                        <ToolbarButton
                          aria-label="Toggle Resequence Mode"
                          appearance="subtle"
                          icon={vm.IsResequencingMode === true ? <CheckmarkFilled /> : <ListBarTreeOffsetFilled />}
                          onClick={async () => {
                            await vm.ToggleResequencingMode();
                          }}
                        />
                      </Tooltip>
                    )}
                  {vm.CanUserEdit && vm.IsResequencingMode && (
                    <Dialog>
                      <Tooltip withArrow content="Cancel Changes" relationship="label">
                        <DialogTrigger disableButtonEnhancement>
                          <ToolbarButton aria-label="Cancel Changes" appearance="subtle" icon={<DismissFilled />} />
                        </DialogTrigger>
                        {/* <Button appearance="secondary">Cancel Changes</Button> */}
                      </Tooltip>
                      <DialogSurface>
                        <DialogBody>
                          <DialogTitle>Do You Really Want To Cancel Changes?</DialogTitle>
                          <DialogActions>
                            <Button
                              className={styles.dialogButton}
                              appearance="primary"
                              onClick={() => vm.RevertResequencingChanges()}
                            >
                              Yes
                            </Button>
                            <DialogTrigger disableButtonEnhancement>
                              <Button appearance="secondary">No</Button>
                            </DialogTrigger>
                          </DialogActions>
                        </DialogBody>
                      </DialogSurface>
                    </Dialog>
                  )}
                  {!isMobile && (
                    <>
                      {/* Button to toggle between large and full sizes */}
                      <Tooltip
                        withArrow
                        content={(vm.DrawerSize === "medium" ? "Expand Content Tree" : "Shrink Content Tree").concat(
                          vm.IsDirty
                            ? " (Unsaved Changes)"
                            : ((vm.FormTreeLevel !== undefined && vm.ContentNodeBefore !== undefined) ||
                                vm.EditNode !== undefined) &&
                              vm.CurrentFormSubTreeLevel !== undefined &&
                              vm.CurrentFormSubTreeLevel >= 8
                            ? " (Add/Edit Form Opened)"
                            : ""
                        )}
                        relationship="label"
                      >
                        <ToolbarButton
                          aria-label="Toggle Tree Size"
                          appearance="subtle"
                          icon={vm.DrawerSize === "medium" ? <PanelLeftExpandFilled /> : <PanelRightExpandFilled />}
                          disabled={
                            vm.IsDirty || (vm.CurrentFormSubTreeLevel !== undefined && vm.CurrentFormSubTreeLevel >= 8)
                          }
                          onClick={() => {
                            vm.DrawerSize = vm.DrawerSize === "medium" ? "full" : "medium";
                          }}
                        />
                      </Tooltip>
                      {/* Button to toggle full screen mode */}
                      <Tooltip
                        withArrow
                        content={(vm.MainDrawerType === "inline" ? "Full Screen" : "Minimize").concat(
                          vm.IsDirty ? " (Unsaved Changes)" : ""
                        )}
                        relationship="label"
                      >
                        <ToolbarButton
                          aria-label="Full Screen Toggle"
                          appearance="subtle"
                          icon={
                            vm.MainDrawerType === "inline" ? <FullScreenMaximizeFilled /> : <FullScreenMinimizeFilled />
                          }
                          disabled={vm.IsDirty}
                          onClick={() => {
                            vm.MainDrawerType = vm.MainDrawerType === "inline" ? "overlay" : "inline";
                          }}
                        />
                      </Tooltip>
                      {/* Button to close the drawer */}
                      <Tooltip withArrow content="Close Content Tree" relationship="label">
                        <ToolbarButton
                          aria-label="Toggle View"
                          appearance="subtle"
                          icon={<TextAlignJustifyFilled />}
                          onClick={() => {
                            setIsDrawerOpen(false);
                            vm.DrawerSize = "medium"; // Reset size when closing
                          }}
                        />
                      </Tooltip>
                    </>
                  )}
                </div>
              }
            >
              {/* Display the Subject details */}
              {/* if the reference ID is used, display it */}
              {vm.SubjectUseRefId && <Subtitle2 className={styles.referenceID}>{vm.Records[0].referenceID}</Subtitle2>}
              <Title3>
                <ExpandableText text={vm.Records[0].name}></ExpandableText>
              </Title3>
            </DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody className={styles.drawerBody}>
            <ContentTree />
          </DrawerBody>
        </LoadingCover>
      </Drawer>
      {/* Content Area (Editor/Viewer) */}
      {/* Show the content section if the drawer is not in full size */}
      <div className={showContentView ? styles.content : styles.hide}>
        {/* On desktop view, render the hamburger icon if the drawer is closed */}
        {!isMobile && !isDrawerOpen && <TreeMenuButton isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />}
        <Divider vertical style={{ height: "100%" }} />
        {!vm.IsEditMode ? <ContentViewer /> : <ContentEditor />}
      </div>
    </div>
  );
});

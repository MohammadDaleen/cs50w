import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { useVM } from "../../../viewModel/context";
import {
  Button,
  Input,
  Label,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
  Tooltip,
  TreeItem,
  TreeItemLayout,
  treeItemLevelToken,
  useSubtreeContext_unstable,
} from "@fluentui/react-components";
import { CheckmarkFilled, DismissFilled } from "@fluentui/react-icons";
import type { Content } from "../../../types";
import { NoData } from "../../NoData";
import { getIconByTreeLevel } from "..";

// Define styles for the component
const useStyles = makeStyles({
  treeItemLayout: {
    width: "100%",
    borderRadius: "4px",
    ...shorthands.padding("4px", "6px"),
  },
  referenceID: {
    color: tokens.colorNeutralForeground3,
  },
  newNodeForm: {
    display: "flex",
  },
  newNodeField: {
    display: "grid",
    gridRowGap: tokens.spacingVerticalXXS,
  },
  newNodeReferenceId: {
    paddingRight: tokens.spacingHorizontalSNudge,
  },
  newNodeName: {
    width: "100%",
  },
  newNodeReferenceIdInput: {
    minWidth: "3rem",
  },
  newNodeNameInput: {
    minWidth: "3rem",
  },
});

export const NewContentTreeItem = observer(({ firstNode }: { firstNode?: boolean }) => {
  const vm = useVM();
  const styles = useStyles();
  const { level: subtreeLevel } = useSubtreeContext_unstable();

  const [newNodeState, setNewNodeState] = useState<{
    referenceId: string | undefined;
    name: string;
    errorIndices: number[];
  }>({
    referenceId: vm.SubjectUseRefId ? vm.GenerateReferenceId() ?? "" : undefined,
    name: "",
    errorIndices: [],
  });

  // Cleanup errors on unmount
  useEffect(() => {
    return () => newNodeState.errorIndices.forEach((index) => vm.DismissError(index));
  }, [newNodeState.errorIndices]);

  if (!vm.FormTreeLevel) {
    vm.AddError("Form type is undefined");
    return <NoData message={"Couldn't Load The Form"} />;
  }
  if (!vm.ContentNodeBefore) {
    vm.AddError('The "Content Node Before" is undefined');
    return <NoData message={"Couldn't Load The Form"} />;
  }

  const formTreeLevel = vm.FormTreeLevel;
  const contentNodeBefore = vm.ContentNodeBefore;

  const uniqueId = Date.now();

  vm.CurrentFormSubTreeLevel = subtreeLevel;

  return (
    <TreeItem
      key={`tree_level_${formTreeLevel}_node_add`}
      value={`tree_level_${formTreeLevel}_node_add`}
      itemType={"leaf"}
      style={{ [treeItemLevelToken]: subtreeLevel }}
    >
      <TreeItemLayout
        iconBefore={getIconByTreeLevel(formTreeLevel, true)}
        main={{ as: "div", className: styles.treeItemLayout }}
        aside={
          <>
            <Tooltip relationship="label" withArrow content={`Add New Chapter`}>
              <Button
                appearance="subtle"
                aria-label={`Add New Chapter`}
                icon={<CheckmarkFilled />}
                disabled={
                  vm.SubjectUseRefId
                    ? !newNodeState.referenceId?.trim() || !newNodeState.name.trim()
                    : !newNodeState.name.trim()
                }
                onClick={async (event) => {
                  // Prevent the click event from bubbling up to parent elements
                  event.stopPropagation();
                  // Clear previous errors
                  newNodeState.errorIndices.forEach((index) => vm.DismissError(index));
                  const newErrorIndices: number[] = [];
                  let hasError = false;
                  // Ensure the reference ID is required
                  if (vm.SubjectUseRefId) {
                    const refId = newNodeState.referenceId?.trim() ?? "";
                    // TODO: Remove or update to new standard
                    // // Format validation
                    // if (!vm.RefIdPattern.test(refId)) {
                    //   newErrorIndices.push(vm.AddError("Reference ID must follow the format: XXX XX XX XX 00"));
                    //   hasError = true;
                    // }
                    // Uniqueness validation (only if format is correct)
                    if (refId && !vm.IsReferenceIdUnique(refId)) {
                      newErrorIndices.push(vm.AddError(`"${refId}" already exists, Reference ID must be unique.`));
                      hasError = true;
                    }
                  }
                  // Update error state and abort if errors exist
                  setNewNodeState((prevState) => ({ ...prevState, errorIndices: newErrorIndices }));
                  if (hasError) return;
                  // Determine the parent node for the new content
                  const parent: Content | undefined =
                    contentNodeBefore.treeLevel === formTreeLevel
                      ? contentNodeBefore.parent // Same parent as contentNodeBefore
                      : {
                          // Otherwise, treat contentNodeBefore as the parent itself
                          id: contentNodeBefore.id,
                          name: contentNodeBefore.name,
                          order: contentNodeBefore.order,
                          parent: contentNodeBefore.parent,
                          parentId: contentNodeBefore.parentId,
                          path: contentNodeBefore.path,
                          referenceID: contentNodeBefore.referenceID,
                          treeLevel: contentNodeBefore.treeLevel,
                        };
                  // Create the new content node object
                  const newNode: Content = {
                    id: `new${uniqueId}`, // Generate a unique ID using timestamp
                    name: newNodeState.name.trim(),
                    // Add the correct order for the new node; the DFS update will reassign the correct orders for the rest of the tree nodes.
                    order:
                      contentNodeBefore.treeLevel === formTreeLevel // If inserting as a sibling node
                        ? vm.GetHighestOrder(contentNodeBefore) + 1 // Use the highest order of the parent's descendants + 1
                        : contentNodeBefore.order + 1, // Else, use the parent's order + 1
                    parent: parent,
                    parentId:
                      contentNodeBefore.treeLevel === formTreeLevel
                        ? contentNodeBefore.parentId // If inserting at same level, keep the same parentId
                        : contentNodeBefore.id, // Else, set current node as parent
                    referenceID: newNodeState.referenceId?.trim(),
                    treeLevel: formTreeLevel,
                  };
                  // Update the path of the new node based on its parent path
                  vm.UpdateNodePath(newNode, newNode.parent?.path || "");
                  // Determine where to insert the new node: only insert after if it is the same type
                  const insertAfter: Content | undefined =
                    contentNodeBefore.treeLevel === formTreeLevel ? contentNodeBefore : undefined;
                  // Add the new node to the content structure
                  await vm.AddContentNode(newNode, insertAfter);
                  // Clear the input fields
                  setNewNodeState((prevState) => ({ ...prevState, name: "", referenceId: undefined }));
                  // Close the new content form
                  vm.CloseNewContentForm();
                }}
              />
            </Tooltip>
            {!firstNode && (
              <Tooltip relationship="label" withArrow content={`Cancel`}>
                <Button
                  appearance="subtle"
                  aria-label={`Cancel`}
                  icon={<DismissFilled />}
                  onClick={(event) => {
                    event.stopPropagation(); // Prevent the click event from bubbling up to parent elements
                    newNodeState.errorIndices.forEach((index) => vm.DismissError(index)); // Ensure error messages are cleared
                    setNewNodeState((prevState) => ({ ...prevState, errorIndices: [] })); // Clear error indices state
                    vm.CloseNewContentForm(); // Close the new content form
                  }}
                />
              </Tooltip>
            )}
          </>
        }
      >
        <div className={styles.newNodeForm}>
          {/* If the reference ID is required, add its field */}
          {vm.SubjectUseRefId && (
            <div className={mergeClasses(styles.newNodeField, styles.newNodeReferenceId)}>
              <Label htmlFor={`newRefId-${uniqueId}`}>Reference ID</Label>
              <Input
                size="small"
                className={styles.newNodeReferenceIdInput}
                id={`newRefId-${uniqueId}`}
                value={newNodeState.referenceId}
                autoFocus
                onChange={(e) => setNewNodeState((prevState) => ({ ...prevState, referenceId: e.target.value }))}
                onClick={(e) => e.stopPropagation()} // Prevent focus from propagating to TreeItem
              />
            </div>
          )}
          <div className={mergeClasses(styles.newNodeField, styles.newNodeName)}>
            <Label htmlFor={`newName-${uniqueId}`}>Name</Label>
            <Input
              size="small"
              className={styles.newNodeNameInput}
              id={`newName-${uniqueId}`}
              value={newNodeState.name}
              onChange={(e) => setNewNodeState((prevState) => ({ ...prevState, name: e.target.value }))}
              onClick={(e) => e.stopPropagation()} // Prevent focus from propagating to TreeItem
            />
          </div>
        </div>
      </TreeItemLayout>
    </TreeItem>
  );
});

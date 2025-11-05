import { observer } from "mobx-react";
import { useEffect, useState } from "react";
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
import { NoData } from "../../..";
import { useVM } from "../../../../viewModel/context";
import type { Content } from "../../../../types";
import { getIconByTreeLevel } from "../";

// Define styles for the component
const useStyles = makeStyles({
  treeItemLayout: {
    width: "100%",
    borderRadius: "4px",
    ...shorthands.padding("4px", "6px"),
  },
  newNodeForm: {
    display: "flex",
  },
  newNodeField: {
    display: "grid",
    gridRowGap: tokens.spacingVerticalXXS,
  },
  newNodeName: {
    width: "100%",
  },
  newNodeNameInput: {
    minWidth: "3rem",
  },
});

export const NewContentTreeItem = observer(({ firstNode }: { firstNode?: boolean }) => {
  const vm = useVM();
  const styles = useStyles();
  const { level: subtreeLevel } = useSubtreeContext_unstable();

  const [newNodeState, setNewNodeState] = useState<{ name: string; errorIndices: number[] }>({
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
                disabled={!newNodeState.name.trim()}
                onClick={async (event) => {
                  // Prevent the click event from bubbling up to parent elements
                  event.stopPropagation();
                  // Clear previous errors
                  newNodeState.errorIndices.forEach((index) => vm.DismissError(index));
                  // Determine the parent node for the new content
                  const parent: Content | undefined =
                    contentNodeBefore.level === formTreeLevel
                      ? contentNodeBefore.parent // Same parent as contentNodeBefore
                      : {
                          // Otherwise, treat contentNodeBefore as the parent itself
                          id: contentNodeBefore.id,
                          name: contentNodeBefore.name,
                          order: contentNodeBefore.order,
                          parent: contentNodeBefore.parent,
                          parentId: contentNodeBefore.parentId,
                          level: contentNodeBefore.level,
                        };
                  // Create the new content node object
                  const newNode: Content = {
                    id: `new${uniqueId}`, // Generate a unique ID using timestamp
                    name: newNodeState.name.trim(),
                    // Add the correct order for the new node; the DFS update will reassign the correct orders for the rest of the tree nodes.
                    order:
                      contentNodeBefore.level === formTreeLevel // If inserting as a sibling node
                        ? vm.GetHighestOrder(contentNodeBefore) + 1 // Use the highest order of the parent's descendants + 1
                        : contentNodeBefore.order + 1, // Else, use the parent's order + 1
                    parent: parent,
                    parentId:
                      contentNodeBefore.level === formTreeLevel
                        ? contentNodeBefore.parentId // If inserting at same level, keep the same parentId
                        : contentNodeBefore.id, // Else, set current node as parent
                    level: formTreeLevel,
                  };
                  // Determine where to insert the new node: only insert after if it is the same type
                  const insertAfter: Content | undefined =
                    contentNodeBefore.level === formTreeLevel ? contentNodeBefore : undefined;
                  // Add the new node to the content structure
                  await vm.AddContentNode(newNode, insertAfter);
                  // Clear the input fields
                  setNewNodeState((prevState) => ({ ...prevState, name: "" }));
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

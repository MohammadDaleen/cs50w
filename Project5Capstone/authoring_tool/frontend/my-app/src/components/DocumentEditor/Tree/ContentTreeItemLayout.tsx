import {
  Caption1Strong,
  makeStyles,
  shorthands,
  tokens,
  Tooltip,
  TreeItemLayout,
  type Slot,
} from "@fluentui/react-components";
import {
  BookStarRegular,
  NotebookRegular,
  CalendarMultipleRegular,
  CalendarEmptyRegular,
  SquaresNestedRegular,
  RibbonStarRegular,
  CircleFilled,
  CalendarAddRegular,
  NotebookAddRegular,
} from "@fluentui/react-icons";
import { ExpandableText } from ".";
import { useVM } from "../../../viewModel/context";
import { observer } from "mobx-react";
import type { Content } from "../../../types";
import { EditContentTreeItem } from "./ContentTreeItemForms";

// Define styles for the component
const useStyles = makeStyles({
  treeItemLayout: {
    width: "100%",
    borderRadius: "4px",
    ...shorthands.padding("4px", "6px"),
  },
  selectedTreeItem: {
    backgroundColor: tokens.colorNeutralBackground5Pressed,
  },
  referenceID: {
    color: tokens.colorNeutralForeground3,
  },
});

export const ContentTreeItemLayout = observer(({ content, aside }: { content: Content; aside?: Slot<"div"> }) => {
  const vm = useVM();
  const styles = useStyles();

  return (
    <TreeItemLayout
      iconBefore={getIconByTreeLevel(content.level)}
      className={vm.SelectedNode?.id === content.id ? styles.selectedTreeItem : ""}
      main={{ as: "div", className: styles.treeItemLayout }}
      {...(aside ? { aside } : {})}
    >
      {vm.EditNode?.id === content.id ? (
        // Render the edit node form, if the record is chose to be edited
        <EditContentTreeItem record={content} />
      ) : (
        // Display the record details
        <>
          {/* if the reference ID is used, display it */}
          {vm.SubjectUseRefId && (
            <div>
              <Caption1Strong className={styles.referenceID}>{`${content.referenceID}`}</Caption1Strong>
            </div>
          )}
          <ExpandableText text={content.name}></ExpandableText>
        </>
      )}
    </TreeItemLayout>
  );
});

/**
 * Maps content types to corresponding icons.
 * @param {string} treeLevel - The tree level of the content node.
 * @returns {JSX.Element} - The corresponding icon or null if type is unknown.
 */
export const getIconByTreeLevel = (treeLevel: number, isNew: boolean = false): JSX.Element => {
  const fontSize = "2.5rem";
  const smallerFontSize = "2rem";
  const smallestFontSize = "1rem";

  return (
    <Tooltip withArrow content={"Chapter"} relationship="label">
      {treeLevel === 0 && !isNew ? (
        <BookStarRegular fontSize={fontSize} />
      ) : treeLevel === 1 && !isNew ? (
        <NotebookRegular fontSize={fontSize} />
      ) : treeLevel === 2 && !isNew ? (
        <CalendarMultipleRegular fontSize={fontSize} />
      ) : treeLevel === 3 && !isNew ? (
        <CalendarEmptyRegular fontSize={smallerFontSize} />
      ) : treeLevel === 4 && !isNew ? (
        <SquaresNestedRegular fontSize={smallerFontSize} />
      ) : treeLevel === 5 && !isNew ? (
        <RibbonStarRegular fontSize={smallerFontSize} />
      ) : treeLevel === 1 && isNew ? (
        <NotebookAddRegular fontSize={fontSize} />
      ) : treeLevel === 2 && isNew ? (
        <CalendarAddRegular fontSize={fontSize} />
      ) : treeLevel === 3 && isNew ? (
        <CalendarAddRegular fontSize={smallerFontSize} />
      ) : (
        <CircleFilled fontSize={smallestFontSize} />
      )}
    </Tooltip>
  );
};

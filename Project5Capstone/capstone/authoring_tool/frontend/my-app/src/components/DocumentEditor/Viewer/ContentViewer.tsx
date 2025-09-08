import { observer } from "mobx-react";
import { useVM } from "../../../viewModel/context";
import { makeStyles, Spinner } from "@fluentui/react-components";
import { HtmlFileRenderer } from ".";
import { NoData } from "../..";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  root: {
    height: "100%",
    width: "100%",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
  },
  noNodes: {
    display: "flex",
    alignItems: "center",
  },
});

/**
 * ContentViewer Component
 * Displays the content of a selected node, shows a loading spinner, or indicates no data is available.
 */
export const ContentViewer = observer(() => {
  const vm = useVM();
  const styles = useStyles();

  // Check if this is the first load (no content file selected yet)
  const firstLoad = vm.SelectedNode === undefined;

  return (
    <div className={styles.root}>
      {vm.AreChapterContentFilesLoading ? (
        // Display a spinner while content is loading
        <Spinner label="Loading..." style={{ margin: "10em" }} />
      ) : vm.SelectedNode && vm.selectedNodeChapterFileUrl && !(vm.selectedNodeChapterFileUrl === "undefined") ? (
        // Render the HTML content if a file is selected and available
        <HtmlFileRenderer src={`${vm.selectedNodeChapterFileUrl}#${vm.encodeWhitespace(vm.SelectedNode.id)}`} />
      ) : firstLoad ? (
        // Ensure no tree level 1 nodes exist under the root (i.e., the tree level 0 node)
        vm.Records[0] &&
        vm.Records[0].treeLevel === 0 &&
        vm.Records[0].children &&
        vm.Records[0].children.length > 0 ? (
          vm.IsResequencingMode ? (
            // Display a message for the case of not exiting the Resequencing Mode
            <NoData message={<span>Save changes to view content</span>} />
          ) : (
            // Display a message for the initial state before any node is selected
            <NoData message={<span>Click on a node from the tree to view content</span>} />
          )
        ) : (
          // Display a message for the initial state before any node existing
          <NoData message={<span className={styles.noNodes}>No Content Yet.</span>} />
        )
      ) : (
        // Display a fallback message when no data is available
        <NoData />
      )}
    </div>
  );
});

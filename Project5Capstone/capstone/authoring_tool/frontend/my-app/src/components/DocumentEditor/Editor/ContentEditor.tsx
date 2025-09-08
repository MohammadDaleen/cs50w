import { observer } from "mobx-react";
import { useVM } from "../../../viewModel/context";
import { makeStyles, Spinner } from "@fluentui/react-components";
import { AttachmentDialog } from "./AttachmentsDialog";
import { MathDialog } from "./MathDialog";
import { TinyMCE } from ".";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  editor: {
    height: "100%",
    width: "100%",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
  },
});

/**
 * ContentEditor Component
 * Displays the content of a selected node, shows a loading spinner, or indicates no data is available.
 */
export const ContentEditor = observer(() => {
  const vm = useVM();
  const styles = useStyles();

  return (
    <>
      <div className={styles.editor}>
        {vm.IsNodeContentFileLoading ? <Spinner label="Loading..." style={{ margin: "10em" }} /> : <TinyMCE />}
      </div>
      <AttachmentDialog />
      <MathDialog />
    </>
  );
});

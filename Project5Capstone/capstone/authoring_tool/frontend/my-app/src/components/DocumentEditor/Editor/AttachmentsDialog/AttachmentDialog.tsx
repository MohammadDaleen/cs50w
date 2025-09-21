import { observer } from "mobx-react-lite";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Tooltip,
} from "@fluentui/react-components";
import { useVM } from "../../../../viewModel/context";
import { ArrowUploadFilled, DismissRegular } from "@fluentui/react-icons";
import { AttachmentList } from "./AttachmentsList";

const useStyles = makeStyles({ surface: { width: "95vw", maxWidth: "1000px" } });

export const AttachmentDialog = observer(() => {
  const vm = useVM();
  const styles = useStyles();

  const noData = Object.values(vm.SelectedNode?.attachments ?? {}).filter((a) => a.fileName).length === 0;

  return (
    <Dialog open={vm.IsAttachmentsDialogOpen}>
      {/* Apply the responsive styles to the DialogSurface */}
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>
            {vm.AttachmentsDialogError ? (
              <MessageBar intent="error">
                <MessageBarBody>
                  <MessageBarTitle>{vm.AttachmentsDialogError}</MessageBarTitle>
                </MessageBarBody>
                <MessageBarActions
                  containerAction={
                    <Button
                      appearance="transparent"
                      onClick={() => vm.SetAttachmentsDialogError(undefined)}
                      icon={<DismissRegular />}
                    />
                  }
                />
              </MessageBar>
            ) : (
              <></>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              Attachment Manager
              <Tooltip content="Upload from device" relationship="description">
                <Button
                  onClick={() => vm.UploadAttachment()}
                  icon={<ArrowUploadFilled />}
                  appearance="primary"
                  style={{ marginLeft: "auto" }}
                  disabled={vm.IsAttachmentsDialogLoading}
                />
              </Tooltip>
            </div>
          </DialogTitle>
          <DialogContent>
            {/* The AttachmentList component will handle its own responsiveness */}
            <AttachmentList />
            {vm.IsAttachmentsDialogLoading ? (
              <Spinner style={{ paddingBlock: "4rem", width: "100%", textAlign: "center" }} />
            ) : noData ? (
              <p style={{ paddingBlock: "4rem", width: "100%", textAlign: "center" }}>No attachments found.</p>
            ) : (
              <></>
            )}
          </DialogContent>
          <DialogActions position="end">
            <Button
              onClick={() => {
                vm.IsAttachmentsDialogOpen = false;
                vm.SetAttachmentsDialogError(undefined);
              }}
              disabled={vm.IsAttachmentsDialogLoading}
            >
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
});

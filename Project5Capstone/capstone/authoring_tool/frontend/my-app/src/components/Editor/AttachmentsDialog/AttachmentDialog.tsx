import { observer } from "mobx-react-lite";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Tooltip,
} from "@fluentui/react-components";
import { useVM } from "../../../viewModel/context";
import { ArrowUploadFilled, DismissRegular } from "@fluentui/react-icons";
import { AttachmentList } from "./AttachmentsList";

export const AttachmentDialog = observer(() => {
  const vm = useVM();

  const noData = Object.values(vm.SelectedNode?.attachments ?? {}).filter((a) => a.fileName).length === 0;

  return (
    <Dialog open={vm.IsAttachmentsDialogOpen}>
      <DialogSurface style={{ minWidth: "1000px", width: "1000px" }}>
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
                justifyContent: "between",
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

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
} from "@fluentui/react-components";
import { useVM } from "../../../viewModel/context";
import { DismissRegular } from "@fluentui/react-icons";
import { MathLiveEditor } from "./MathLiveEditor";

export const MathDialog = observer(() => {
  const vm = useVM();

  return (
    <Dialog open={vm.IsMathDialogOpen}>
      <DialogSurface style={{ minWidth: "1000px", width: "1000px" }}>
        <DialogBody>
          <DialogTitle>
            {vm.MathDialogError ? (
              <MessageBar intent="error">
                <MessageBarBody>
                  <MessageBarTitle>{vm.MathDialogError}</MessageBarTitle>
                </MessageBarBody>
                <MessageBarActions
                  containerAction={
                    <Button
                      appearance="transparent"
                      onClick={() => {
                        vm.SetMathDialogError(undefined);
                      }}
                      icon={<DismissRegular />}
                    />
                  }
                />
              </MessageBar>
            ) : (
              <></>
            )}
            Math Equations Editor
          </DialogTitle>
          <DialogContent style={{ overflow: "visible" }}>
            <MathLiveEditor />
            {vm.IsMathDialogLoading && <Spinner style={{ paddingBlock: "4rem", width: "100%", textAlign: "center" }} />}
          </DialogContent>
          <DialogActions position="end">
            <Button appearance="primary" onClick={() => vm.InsertEquation()} disabled={vm.IsMathDialogLoading}>
              Insert
            </Button>
            <Button
              onClick={() => {
                vm.IsMathDialogOpen = false;
                vm.SetMathDialogError(undefined);
              }}
              disabled={vm.IsMathDialogLoading}
            >
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
});

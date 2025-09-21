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
} from "@fluentui/react-components";
import { useVM } from "../../../../viewModel/context";
import { DismissRegular } from "@fluentui/react-icons";
import { MathLiveEditor } from "./MathLiveEditor";

const useStyles = makeStyles({ surface: { width: "95vw", maxWidth: "800px" } });

export const MathDialog = observer(() => {
  const vm = useVM();
  const styles = useStyles();

  return (
    <Dialog open={vm.IsMathDialogOpen}>
      {/* Apply the responsive styles to the DialogSurface */}
      <DialogSurface className={styles.surface}>
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
                      onClick={() => vm.SetMathDialogError(undefined)}
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

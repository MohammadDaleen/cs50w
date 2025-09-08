import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  Input,
  Field,
  Checkbox,
  Spinner,
  Tooltip,
  makeStyles,
} from "@fluentui/react-components";
import { useVM } from "../../../../viewModel/context";
import { LinkDismissRegular, LinkRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  dialog: {
    minWidth: "50rem",
    width: "50rem",
  },
  spinner: {
    padding: "1rem",
  },
  actions: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "end",
    width: "100%",
    columnGap: "1rem",
    paddingBottom: "0.5rem",
  },
});

export const RawImageDialog = observer(
  ({ isOpen, setIsOpen, attachmentId }: { isOpen: boolean; setIsOpen: (a: boolean) => void; attachmentId: string }) => {
    const vm = useVM();
    const styles = useStyles();
    const [hasCustomDimensions, setHasCustomDimensions] = React.useState<boolean>(false);
    const [isDimensionsLoading, setIsDimensionsLoading] = React.useState<boolean>(false);
    const [isLinked, setIsLinked] = React.useState<boolean>(true);
    const [width, setWidth] = useState<string>("");
    const [widthError, setWidthError] = useState<string | undefined>(undefined);
    const [height, setHeight] = useState<string>("");
    const [heightError, setHeightError] = useState<string | undefined>(undefined);
    const [ratio, setRatio] = React.useState<number>(0);

    const MAX_WIDTH = 685;

    const handleCheckboxChange = () => {
      setHasCustomDimensions(!hasCustomDimensions);
      /* load the image and seed width/height */
      if (width && height) return; // ensure load only once
      setIsDimensionsLoading(true);
      const url = vm.SelectedNode?.attachments[attachmentId].url; // get the image URL
      if (url) {
        const img = new Image();
        // set onload
        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          const ratio = width / height;
          setRatio(ratio);
          // Ensure max width is not exceeded
          if (width > MAX_WIDTH) {
            setWidth(`${MAX_WIDTH}`);
            setHeight(`${Math.round((1 / ratio) * MAX_WIDTH)}`);
          } else {
            setWidth(width.toString());
            setHeight(height.toString());
          }
          setIsDimensionsLoading(false);
        };
        img.src = url; // kicks off the load event
      }
    };

    const handleInsertClick = () => {
      if (!hasCustomDimensions) vm.InsertAttachment(attachmentId, true);
      else {
        let isError = false;
        // Ensure values exist
        if (!width?.trim()) {
          setWidthError("Width is required");
          isError = true;
        } else setWidthError(undefined);
        if (!height?.trim()) {
          setHeightError("Height is required");
          isError = true;
        } else setHeightError(undefined);
        if (isError) return;
        // Ensure values are valid
        const numberWidth = parseInt(width || "0");
        const numberHeight = parseInt(height || "0");
        if (numberWidth <= 0 || numberWidth > MAX_WIDTH) {
          setWidthError(`Width must be positive (≤${MAX_WIDTH})`);
          isError = true;
        } else setWidthError(undefined);
        if (!(numberHeight > 0)) {
          setHeightError("Height must be positive");
          isError = true;
        } else setHeightError(undefined);
        if (isError) return;
        // Insert the attachment
        vm.InsertAttachment(attachmentId, true, numberWidth, numberHeight);
      }
    };

    return (
      <Dialog open={isOpen}>
        <DialogSurface className={styles.dialog}>
          <DialogBody>
            <DialogContent className={styles.actions}>
              {isDimensionsLoading ? (
                <Spinner className={styles.spinner} label="Loading Dimensions..." />
              ) : (
                <>
                  <Checkbox checked={hasCustomDimensions} label="Custom Dimensions" onChange={handleCheckboxChange} />
                  {hasCustomDimensions && (
                    <>
                      <Field label="Width" validationMessage={widthError}>
                        <Input
                          type="number"
                          disabled={!hasCustomDimensions}
                          value={width}
                          size="small"
                          onChange={(_event, data) => {
                            if (widthError) setWidthError(undefined); // Erase width error message, if exist
                            setWidth(data.value);
                            if (isLinked) setHeight(`${Math.round((1 / ratio) * Number(data.value))}`); // Maintain aspect ratio
                          }}
                        />
                      </Field>
                      <Tooltip content={isLinked ? "Linked" : "Not Linked"} relationship="label">
                        <Button
                          appearance="transparent"
                          icon={isLinked ? <LinkRegular /> : <LinkDismissRegular />}
                          size="small"
                          onClick={() => {
                            setIsLinked(!isLinked);
                            setHeight(`${Math.round((1 / ratio) * Number(width))}`); // Ensure the aspect ratio is maintained
                          }}
                        />
                      </Tooltip>
                      <Field label="Height" validationMessage={heightError}>
                        <Input
                          type="number"
                          disabled={!hasCustomDimensions}
                          value={height}
                          size={"small"}
                          onChange={(_event, data) => {
                            if (heightError) setHeightError(undefined); // Erase height error message, if exist
                            setHeight(data.value);
                            if (isLinked) setWidth(`${Math.round(ratio * Number(data.value))}`); // Maintain aspect ratio
                          }}
                        />
                      </Field>
                    </>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions position="end">
              <Button appearance="primary" disabled={isDimensionsLoading} onClick={handleInsertClick}>
                Insert
              </Button>
              <Button disabled={isDimensionsLoading} onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    );
  }
);

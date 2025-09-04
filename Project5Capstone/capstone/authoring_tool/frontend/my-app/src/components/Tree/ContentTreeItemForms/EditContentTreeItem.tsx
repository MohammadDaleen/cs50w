import { observer } from "mobx-react";
import React from "react";
import { Button, Input, Label, Tooltip, makeStyles, mergeClasses, tokens, useId } from "@fluentui/react-components";
import { CheckmarkFilled, DismissFilled } from "@fluentui/react-icons";
import { useVM } from "../../../viewModel/context";
import type { Content } from "../../../types";
import { NoData } from "../../NoData";

const useStyles = makeStyles({
  form: { display: "flex" },
  field: { display: "grid", gridRowGap: tokens.spacingVerticalXXS },
  reference: { paddingRight: tokens.spacingHorizontalSNudge },
  name: { width: "100%" },
  input: { minWidth: "3rem" },
});

export const EditContentTreeItem = observer(({ record }: { record: Content }) => {
  const vm = useVM();
  const styles = useStyles();

  const idPrefix = "edit-";
  const inputIds = {
    reference: useId(idPrefix + record.id),
    name: useId(idPrefix + record.id + "-name"),
  };

  // Ensure the content node details to edit exist
  if (!vm.EditNode) {
    vm.AddError("Could Not Find Content Node Details To Edit");
    return <NoData />;
  }

  return (
    <div className={styles.form}>
      {/* If the reference ID is required, add its field */}
      {vm.SubjectUseRefId && (
        <div className={mergeClasses(styles.field, styles.reference)}>
          <Label htmlFor={inputIds.reference}>Reference ID</Label>
          <Input
            id={inputIds.reference}
            size="small"
            className={styles.input}
            value={vm.EditNode.referenceID}
            autoFocus
            onChange={(_, data) => {
              // Ensure the content node details to edit exist
              if (!vm.EditNode) {
                vm.AddError("Could Not Find Content Node Details To Edit");
                return;
              }
              vm.EditNode.referenceID = data.value;
              return vm.EditNode.referenceID;
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className={mergeClasses(styles.field, styles.name)}>
        <Label htmlFor={inputIds.name}>Name</Label>
        <Input
          id={inputIds.name}
          size="small"
          className={styles.input}
          value={vm.EditNode.name}
          onChange={(_, data) => {
            // Ensure the content node details to edit exist
            if (!vm.EditNode) {
              vm.AddError("Could Not Find Content Node Details To Edit");
              return;
            }
            vm.EditNode.name = data.value;
            return vm.EditNode.name;
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
});

export const EditContentFormAction = observer(({ record }: { record: Content }) => {
  const vm = useVM();
  const [errorIndices, setErrorIndices] = React.useState<number[]>([]);
  // Ensure the content node details to edit exist
  if (!vm.EditNode) {
    vm.AddError("Could Not Find Content Node Details To Edit");
    return <NoData />;
  }
  // Cleanup errors on unmount
  React.useEffect(() => {
    return () => errorIndices.forEach((index) => vm.DismissError(index));
  }, [errorIndices]);
  return (
    <>
      <Tooltip relationship="label" withArrow content={`Save Chapter`}>
        <Button
          icon={<CheckmarkFilled />}
          appearance="subtle"
          disabled={
            vm.SubjectUseRefId ? !vm.EditNode.referenceID?.trim() || !vm.EditNode.name.trim() : !vm.EditNode.name.trim()
          }
          onClick={async (event) => {
            // Prevent the click event from bubbling up to parent elements
            event.stopPropagation();
            // Ensure the content node details to edit exist
            if (!vm.EditNode) {
              vm.AddError("Could Not Find Content Node Details To Edit");
              return;
            }
            // Clear previous errors
            errorIndices.forEach((index) => vm.DismissError(index));
            const newErrorIndices: number[] = [];
            let hasError = false;
            // Ensure the reference ID is required
            if (vm.SubjectUseRefId) {
              const refId = vm.EditNode.referenceID?.trim() ?? "";
              // TODO: Remove or update to new standard
              // // Format validation
              // if (!vm.RefIdPattern.test(refId)) {
              //   newErrorIndices.push(vm.AddError("Reference ID must follow the format: XXX XX XX XX 00"));
              //   hasError = true;
              // }
              // Uniqueness validation (only if format is correct)
              if (refId && refId !== record.referenceID && !vm.IsReferenceIdUnique(refId)) {
                newErrorIndices.push(vm.AddError(`"${refId}" already exists, Reference ID must be unique.`));
                hasError = true;
              }
            }
            // Update error state and abort if errors exist
            setErrorIndices(newErrorIndices);
            if (hasError) return;
            // Proceed with save if change exist and no errors
            if (vm.EditNode.referenceID?.trim() !== record.referenceID || vm.EditNode.name.trim() !== record.name) {
              await vm.UpdateContentNode({
                ...record,
                referenceID: vm.EditNode.referenceID?.trim(),
                name: vm.EditNode.name.trim(),
              });
            }
            // Close the edit content form
            vm.CloseEditContentForm();
          }}
        />
      </Tooltip>
      <Tooltip relationship="label" withArrow content={`Cancel`}>
        <Button
          icon={<DismissFilled />}
          appearance="subtle"
          onClick={(event) => {
            event.stopPropagation(); // Prevent event bubbling to parent
            errorIndices.forEach((index) => vm.DismissError(index)); // Ensure error messages are cleared
            setErrorIndices([]); // Clear error indices state
            vm.CloseEditContentForm(); // Close the edit content form
          }}
        />
      </Tooltip>
    </>
  );
});

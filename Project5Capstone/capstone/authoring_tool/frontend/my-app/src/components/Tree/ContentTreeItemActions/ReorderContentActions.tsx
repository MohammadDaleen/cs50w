import { Button, Tooltip } from "@fluentui/react-components";
import {
  ArrowUpFilled,
  ArrowDownFilled,
  ArrowSortDownLinesFilled,
  ArrowSortUpLinesFilled,
} from "@fluentui/react-icons";
import { useVM } from "../../../viewModel/context";
import type { Content } from "../../../types/Content";
import { observer } from "mobx-react";

export const ReorderContentActions = observer(({ record }: { record: Content }) => {
  const vm = useVM();

  const { siblings, index } = vm.FindNodeAndSiblings(record.id);

  const isFirstNode: boolean = index === 0;
  const isLastNode: boolean = siblings ? index === siblings.length - 1 : true;
  const hasPreviousParent: boolean = record.parent && vm.findPreviousSibling(record.parent?.id) ? true : false;
  const hasNextParent: boolean = record.parent && vm.findNextSibling(record.parent?.id) ? true : false;

  return (
    <>
      {/* Button to Move Up / to Move to Previous Parent */}
      <Tooltip relationship="label" withArrow content={isFirstNode ? "Move to Previous Parent" : "Move Up"}>
        <Button
          icon={isFirstNode ? <ArrowSortUpLinesFilled /> : <ArrowUpFilled />}
          appearance="subtle"
          disabled={isFirstNode && !hasPreviousParent}
          onClick={(e) => {
            e.stopPropagation();
            if (isFirstNode) vm.MoveNodeToPreviousParent(record.id);
            else vm.MoveNodeUp(record.id);
          }}
        />
      </Tooltip>
      {/* Button to Move Down / to Move to Next Parent */}
      <Tooltip relationship="label" withArrow content={isLastNode ? "Move to Next Parent" : "Move Down"}>
        <Button
          icon={isLastNode ? <ArrowSortDownLinesFilled /> : <ArrowDownFilled />}
          appearance="subtle"
          disabled={isLastNode && !hasNextParent}
          onClick={(e) => {
            e.stopPropagation();
            if (isLastNode) vm.MoveNodeToNextParent(record.id);
            else vm.MoveNodeDown(record.id);
          }}
        />
      </Tooltip>
    </>
  );
});

import { Tree } from "@fluentui/react-components";
import { observer } from "mobx-react";
import { useVM } from "../../viewModel/context";
import { NoData, ContentTreeItem } from "..";
import { NewContentTreeItem } from "./ContentTreeItemForms";

/**
 * ContentTree Component
 * Renders a hierarchical tree structure for content records.
 * Displays a "No Data" message if there are no records.
 */
export const ContentTree = observer(() => {
  const vm = useVM();

  if (!vm.Records.length) return <NoData />;

  // Open a new content form, if the subject has no children
  if (vm.Records[0] && (!vm.Records[0].children || !(vm.Records[0].children.length > 0)))
    vm.OpenNewContentForm(vm.Records[0], vm.Records[0].treeLevel + 1);

  return (
    <Tree aria-label="Content Tree">
      {vm.Records[0].children && vm.Records[0].children.length > 0 ? (
        vm.Records[0].children.map((record) => <ContentTreeItem key={record.id} record={record} level={`root`} />)
      ) : (
        <NewContentTreeItem firstNode />
      )}
    </Tree>
  );
});

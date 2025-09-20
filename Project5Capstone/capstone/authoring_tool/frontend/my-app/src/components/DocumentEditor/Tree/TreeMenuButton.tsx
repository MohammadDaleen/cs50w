import { Hamburger, makeStyles, mergeClasses, Tooltip, useRestoreFocusTarget } from "@fluentui/react-components";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../viewModel/context";

const useStyles = makeStyles({
  marginRight: {
    marginRight: "16px",
  },
  marginLeft: {
    marginLeft: "16px",
  },
});

type props = {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (value: boolean) => void;
};

export const TreeMenuButton = observer(({ isDrawerOpen, setIsDrawerOpen }: props) => {
  const vm = useVM();
  const styles = useStyles();
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  return (
    <div
      className={vm.DrawerType === "inline" ? styles.marginRight : mergeClasses(styles.marginLeft, styles.marginRight)}
    >
      <Tooltip content="Open Tree Content" relationship="label">
        <Hamburger
          {...restoreFocusTargetAttributes}
          onClick={() => {
            setIsDrawerOpen(!isDrawerOpen); // Toggle drawer open/close state
            vm.DrawerSize = "medium"; // Set the drawer size to medium by default
          }}
        />
      </Tooltip>
    </div>
  );
});

import React from "react";
import { observer } from "mobx-react";
import { Spinner, makeStyles, Card } from "@fluentui/react-components";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  /** The floating veil */
  overlay: {
    position: "absolute",
    inset: 0, // shorthand for top/right/bottom/left = 0
    backgroundColor: "rgba(255,255,255,0.5)",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1, // just above siblings inside the container, 1000 is save
    pointerEvents: "auto", // block clicks (set to 'none' for passthrough)
  },
  /** the loading spinner */
  spinner: {
    padding: "10rem",
  },
});

/**
 * Wrap any chunk of UI and, when `loading` is true,
 * dim it and show a centered Fluent UI Spinner.
 *
 * It's parent element should have a specified position,
 * for simplicity add ***position: "relative"*** to the parent element.
 *
 * @param {boolean} loading - Indecates whether the loading cover is visible or not.
 * @param {string} label - Custom message to display.
 * @param {React.ReactNode} children - Children elements warpped in the loading cover.
 */
export const LoadingCover = observer(
  ({ loading, label, children }: { loading: boolean; label?: string; children: React.ReactNode }) => {
    const styles = useStyles();
    return (
      <>
        {loading && (
          <div className={styles.overlay}>
            {label && (
              <Card appearance="filled-alternative">
                <Spinner className={styles.spinner} label={label ? label : null} />
              </Card>
            )}
          </div>
        )}
        {children}
      </>
    );
  }
);

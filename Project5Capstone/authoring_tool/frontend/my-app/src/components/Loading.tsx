import React from "react";
import { observer } from "mobx-react";
import { makeStyles, Spinner } from "@fluentui/react-components";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  loading: {
    width: "100%",
    height: "100%",
    paddingTop: "8rem",
    paddingBottom: "8rem",
  },
});

/**
 * Loading Component
 * Displays a placeholder spinner with message when loading.
 * @param {object} props - Props for the component.
 * @param {string} props.message - Custom message to display. Defaults to "Loading".
 */
export const Loading = observer(({ message = "Loading..." }: { message?: string | React.JSX.Element }) => {
  const styles = useStyles();

  // TODO: Modern loading screen*
  return <Spinner label={message} className={styles.loading} />;
});

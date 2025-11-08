import React from "react";
import { observer } from "mobx-react";
import { makeStyles, mergeClasses, Title2 } from "@fluentui/react-components";
import { Container } from "react-bootstrap";

// Define styles using Fluent UI's makeStyles
const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  root: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  padding: {
    paddingTop: "10rem",
    paddingBottom: "10rem",
  },
  title: {
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
});

/**
 * NoData Component
 * Displays a placeholder message when no data is available.
 * @param {object} props - Props for the component.
 * @param {string} props.message - Custom message to display. Defaults to "No Data to Display".
 */
export const NoData = observer(
  ({
    message = "No Data to Display",
    addPadding = true,
  }: {
    message?: string | React.JSX.Element;
    addPadding?: boolean;
  }) => {
    const styles = useStyles();
    return (
      <Container className={styles.mobileContainer}>
        <div className={addPadding ? mergeClasses(styles.padding, styles.root) : styles.root}>
          {/* Display the placeholder message */}
          <Title2 className={styles.title}>{message}</Title2>
        </div>
      </Container>
    );
  }
);

import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useVM } from "../../viewModel/context";
import { Loading } from "../Loading";
import { ContentDrawer } from "./ContentDrawer";
import { Container } from "react-bootstrap";
import { Drawer, makeStyles, useRestoreFocusSource } from "@fluentui/react-components";
import { useParams } from "react-router-dom";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const useStyles = makeStyles({
  container: {
    flex: 1, // Take all available space
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e0e0e0",
    borderTopWidth: "0",
    borderBottomWidth: "0",
  },
  // The full-screen drawer that contains the entire editor experience.
  drawer: {
    flex: 1, // Take all available space
    display: "flex",
    flexDirection: "column",
  },
});

export const DocumentEditor = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Get the documentId from URL params
  const params = useParams();
  const [errorIndices, setErrorIndices] = useState<number[]>([]);
  const isMobile = useMediaQuery();

  // Cleanup errors on unmount
  useEffect(() => {
    return () => errorIndices.forEach((index) => vm.DismissError(index));
  }, [errorIndices]);

  useEffect(() => {
    if (!params.documentId) {
      setErrorIndices((prev) => [...prev, vm.AddError("Couldn't get the document ID from the URL")]);
      return;
    }
    // Retrieve the document data from the VM using the documentId.
    const id = params.documentId;
    vm.LoadDocumentEditor(id).then((errorIds: number[]) => {
      setErrorIndices((prev) => [...prev, ...errorIds]);
      setIsLoading(false);
    });
  }, []);

  // all overlay & inline* Drawers need manual focus restoration attributes
  const restoreFocusSourceAttributes = useRestoreFocusSource();

  if (isLoading) return <Loading message={"Loading Authoring Tool..."} />;

  return (
    <Container className={styles.container} style={isMobile ? { maxWidth: "100%", padding: 0 } : {}}>
      {/* This top-level Drawer serves as the full-screen container. It is always open. */}
      <Drawer
        {...restoreFocusSourceAttributes}
        className={styles.drawer}
        type={vm.MainDrawerType}
        open
        position="bottom"
        size="full"
        // Disable animations as they can be jarring on mobile
        backdropMotion={null}
        surfaceMotion={null}
      >
        <ContentDrawer />
      </Drawer>
    </Container>
  );
});

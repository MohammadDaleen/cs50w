import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useVM } from "../../viewModel/context";
import { Loading } from "../Loading";
import { ContentDrawer } from "./ContentDrawer";
import { Container } from "react-bootstrap";
import { makeStyles } from "@fluentui/react-components";
import { useNavigate, useParams } from "react-router-dom";

const useStyles = makeStyles({
  container: {
    flex: 1, // Take all available space
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e0e0e0",
    borderTopWidth: "0",
    borderBottomWidth: "0",
  },
});

export const DocumentEditor = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  //TODO const navigate = useNavigate();
  // Get the documentId from URL params
  const params = useParams();
  const [errorIndices, setErrorIndices] = useState<number[]>([]);

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
    const id = Number.parseInt(params.documentId);
    vm.LoadDocumentEditor(id).then((errorIds: number[]) => {
      setErrorIndices((prev) => {
        return [...prev, ...errorIds];
      });
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <Loading message={"Loading Authoring Tool..."} />;

  return (
    <Container className={styles.container}>
      {/* //TODO: Add navigation to previous page */}
      <ContentDrawer />
    </Container>
  );
});

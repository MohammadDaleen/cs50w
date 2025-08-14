import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useVM } from "../viewModel/context";
import { Loading } from "./Loading";
import { NoData } from "./NoData";
import { makeStyles } from "@fluentui/react-components";
import { Container } from "react-bootstrap";

const useStyles = makeStyles({
  mobileContainer: {
    maxWidth: "33.75rem",
  },
  noData: {
    marginTop: "3rem",
    marginBottom: "3rem",
  },
  pagenation: {
    display: "flex",
    justifyContent: "center",
  },
});

export const Index = observer(() => {
  const vm = useVM();
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!vm.ErrorMessage) {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) return <Loading message={"Loading Posts..."} />;

  return (
    <>
      {/* Only authenticated users are allowed to post new posts */}
      {vm.GetToken() && vm.User?.isAuthenticated && (
        <Container className={styles.mobileContainer}>
          <h1>NewPostForm</h1>
        </Container>
      )}
      <Container className={styles.mobileContainer}>
        {/* Ensure posts exist */}
        <NoData message={"No Posts Yet!"} />
      </Container>
    </>
  );
});

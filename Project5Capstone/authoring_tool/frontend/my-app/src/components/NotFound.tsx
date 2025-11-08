import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { Button, makeStyles, Title1, Body2, tokens } from "@fluentui/react-components";
import { DismissCircleFilled } from "@fluentui/react-icons";
import Container from "react-bootstrap/Container";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2rem",
    paddingTop: "4rem",
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  buttonLink: {
    textDecoration: "none",
    display: "inline-block", // Ensures the Button retains its styling
  },
});

export const NotFound = observer(() => {
  const styles = useStyles();
  return (
    <Container>
      <div className={styles.container}>
        <Title1 className={styles.title}>
          <DismissCircleFilled color={tokens.colorPaletteRedBackground3} fontSize={"4rem"} />
          404 Not Found
        </Title1>
        <Body2>The page you are looking for does not exist.</Body2>
        <Link to="/" className={styles.buttonLink}>
          <Button size="large" appearance="primary">
            Go Home
          </Button>
        </Link>
      </div>
    </Container>
  );
});

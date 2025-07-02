import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ArrowEnterFilled } from "@fluentui/react-icons";
import { Input, Button, makeStyles, Title1 } from "@fluentui/react-components";
import { useVM } from "../viewModel/context";
import { Link, useNavigate } from "react-router-dom";
import { Loading } from "./Loading";

const useStyles = makeStyles({
  root: {
    margin: "0 auto",
    width: "18.75rem",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2rem",
  },
  title: {
    // marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  form: {
    width: "100%",
  },
  formInput: {
    marginBottom: "1rem",
    width: "100%",
  },
  formField: {
    width: "100%",
  },
  formButton: {
    width: "100%",
  },
});

export const Login = observer(() => {
  const styles = useStyles();
  const vm = useVM();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginState, setLoginState] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await vm.Login(loginState.username, loginState.password);
    setIsLoading(false);
    navigate("/");
  };

  // Prevent already logged in users from visiting login page
  if (vm.Token && vm.User?.isAuthenticated) navigate("/", { replace: true });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className={styles.root}>
      <Title1 className={styles.title}>
        <ArrowEnterFilled fontSize={"3rem"} />
        Login
      </Title1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formInput}>
          <Input
            id="username"
            className={styles.formField}
            appearance="filled-darker"
            placeholder="Username"
            size="large"
            value={loginState.username}
            onChange={(e) => setLoginState((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
        </div>
        <div className={styles.formInput}>
          <Input
            id="password"
            type="password"
            className={styles.formField}
            appearance="filled-darker"
            size="large"
            placeholder="Password"
            value={loginState.password}
            onChange={(e) => setLoginState((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
        <Button size="large" type="submit" appearance="primary" className={styles.formButton}>
          Login
        </Button>
      </form>
      <div>
        Don't have an account? <Link to="/register">Register here.</Link>
      </div>
    </div>
  );
});

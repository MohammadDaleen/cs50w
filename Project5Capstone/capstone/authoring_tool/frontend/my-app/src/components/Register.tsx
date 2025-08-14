import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Input, Button, makeStyles, Title1 } from "@fluentui/react-components";
import { PersonAddFilled } from "@fluentui/react-icons";
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
  // title: {
  //   marginBottom: "1rem",
  // },
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

export const Register = observer(() => {
  const styles = useStyles();
  const vm = useVM();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [registerState, setRegisterState] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await vm.Register(registerState);
    setIsLoading(false);
    navigate("/");
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className={styles.root}>
      <Title1 className={styles.title}>
        <PersonAddFilled fontSize={"3rem"} />
        Register
      </Title1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formInput}>
          <Input
            id="username"
            className={styles.formField}
            appearance="filled-darker"
            placeholder="Username"
            size="large"
            value={registerState.username}
            onChange={(e) => setRegisterState((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
        </div>
        <div className={styles.formInput}>
          <Input
            id="email"
            type="email"
            className={styles.formField}
            appearance="filled-darker"
            size="large"
            placeholder="Email Address"
            value={registerState.email}
            onChange={(e) => setRegisterState((prev) => ({ ...prev, email: e.target.value }))}
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
            value={registerState.password}
            onChange={(e) => setRegisterState((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
        <div className={styles.formInput}>
          <Input
            id="confirmPassword"
            type="password"
            className={styles.formField}
            appearance="filled-darker"
            size="large"
            placeholder="Confirm Password"
            value={registerState.confirmPassword}
            onChange={(e) => setRegisterState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
        </div>
        <Button size="large" type="submit" appearance="primary" className={styles.formButton}>
          Register
        </Button>
      </form>
      <div>
        Already have an account? <Link to="/login">Log in here.</Link>
      </div>
    </div>
  );
});

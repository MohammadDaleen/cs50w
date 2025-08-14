import {
  Button,
  FluentProvider,
  makeStyles,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  teamsDarkTheme,
  teamsLightTheme,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import ContextProvider from "../viewModel/context";
import AuthoringToolVM from "../viewModel/AuthoringToolVM";
import ServiceProvider from "../ServiceProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./Layout";
import { NotFound } from "./NotFound";
import { Login } from "./Login";
import { Register } from "./Register";
import { Index } from "./Index";
import { ProtectedRoute } from "./ProtectedRoute";
import { Loading } from "./Loading";

export interface props {
  serviceProvider: ServiceProvider;
}

// TODO: Find better way/structure (and location) for managing routes*
// TODO: move to Layout.tsx (or reduce main, app, layout)*
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/", element: <Index /> },
      {
        path: "/",
        element: <ProtectedRoute />,
        children: [
          // Protected routes
          // { path: "/following", element: <FollowingPage /> },
          // { path: "/post/:postId", element: <PostDetail /> },
        ],
      },
      // { path: "/:username", element: <ProfilePage /> },
      // {
      //   path: "/:username/:listType", // listType: followers or followees
      //   element: <FollowList />,
      // },
    ],
  },
]);

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "start",
    alignItems: "stretch",
    boxSizing: "border-box",
  },
  warpper: {
    minHeight: "100vh",
  },
});

export const App = observer(({ serviceProvider }: props) => {
  const styles = useStyles();
  const vm = serviceProvider.get<AuthoringToolVM>(AuthoringToolVM.serviceName);
  const forceUpdate = React.useReducer(() => ({}), {})[1] as () => void;

  useEffect(() => {
    if (!vm.forceUpdate) vm.forceUpdate = forceUpdate;
  }, []);

  return (
    <FluentProvider
      theme={vm.IsLightMode ? teamsLightTheme : teamsDarkTheme}
      className={styles.root}
      data-bs-theme={vm.IsLightMode ? "light" : "dark"}
    >
      <div className={styles.warpper}>
        {vm.PcfError ? (
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>{vm.PcfError}</MessageBarTitle>
            </MessageBarBody>
          </MessageBar>
        ) : (
          <ContextProvider value={vm}>
            {vm.IsLoading ? (
              <Loading />
            ) : (
              <>
                {vm.ErrorMessage && (
                  <MessageBar intent="error">
                    <MessageBarBody>
                      <MessageBarTitle>{vm.ErrorMessage}</MessageBarTitle>
                    </MessageBarBody>
                    <MessageBarActions
                      containerAction={
                        <Button
                          appearance="transparent"
                          onClick={() => {
                            vm.SetError(undefined);
                          }}
                          icon={<DismissRegular />}
                        />
                      }
                    />
                  </MessageBar>
                )}
                <RouterProvider router={router} />
              </>
            )}
          </ContextProvider>
        )}
      </div>
    </FluentProvider>
  );
});

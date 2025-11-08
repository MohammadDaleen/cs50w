import {
  Button,
  FluentProvider,
  makeStyles,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarGroup,
  MessageBarTitle,
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import ContextProvider from "../viewModel/context";
import AuthoringToolVM from "../viewModel/AuthoringToolVM";
import ServiceProvider from "../ServiceProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Loading, ProtectedRoute, DocumentManager, Register, Login, Layout, NotFound } from "./index";
import { DocumentEditor } from "./DocumentEditor/DocumentEditor";

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
      { path: "/", element: <DocumentManager /> },
      {
        path: "/",
        element: <ProtectedRoute />,
        children: [
          // Protected routes
          { path: "/document/:documentId", element: <DocumentEditor /> },
        ],
      },
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
    display: "flex", // Add flex display
    flexDirection: "column", // Stack children vertically
    flex: 1, // Take available space
  },
  messageBarGroup: {
    flexShrink: "0", // Prevent the message bar group from shrinking
  },
  // The main content area
  contentArea: {
    flex: 1, // Take all available space
    display: "flex",
    flexDirection: "column",
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
      theme={vm.IsDarkMode ? webDarkTheme : webLightTheme}
      className={styles.root}
      data-bs-theme={vm.IsDarkMode ? "dark" : "light"}
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
              <div className={styles.contentArea}>
                <MessageBarGroup animate="both" className={styles.messageBarGroup}>
                  {Array.from(vm.ErrorMessages).map((errMsg, idx) => (
                    <MessageBar key={`error-${idx}`} intent="error">
                      <MessageBarBody>
                        <MessageBarTitle>{errMsg[1]}</MessageBarTitle>
                      </MessageBarBody>
                      <MessageBarActions
                        containerAction={
                          <Button
                            onClick={() => vm.DismissError(errMsg[0])}
                            aria-label="dismiss"
                            appearance="transparent"
                            icon={<DismissRegular />}
                          />
                        }
                      />
                    </MessageBar>
                  ))}
                </MessageBarGroup>
                <RouterProvider router={router} />
              </div>
            )}
          </ContextProvider>
        )}
      </div>
    </FluentProvider>
  );
});

import { Navigate, Outlet } from "react-router-dom";
import { useVM } from "../viewModel/context";
import { observer } from "mobx-react";

export const ProtectedRoute = observer(() => {
  const vm = useVM();
  // If authenticated, render the child component (Index)
  if (vm.User?.isAuthenticated) {
    return <Outlet />;
  }
  // If the user is not authenticated, redirect to the login page
  return <Navigate to="/login" replace />;
});

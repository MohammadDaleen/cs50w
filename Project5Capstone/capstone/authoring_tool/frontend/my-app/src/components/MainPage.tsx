import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useVM } from "../viewModel/context";
import { Loading } from "./Loading";
import { ContentDrawer } from "./ContentDrawer";

export const MainPage = observer(() => {
  const vm = useVM();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!vm.ErrorMessages) {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) return <Loading message={"Loading Posts..."} />;

  return (
    <>
      {/* Only authenticated users are allowed to post new posts */}
      {vm.GetToken() && vm.User?.isAuthenticated && <ContentDrawer />}
      {/* //TODO: Replace with README */}
      <ContentDrawer />
    </>
  );
});

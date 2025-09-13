import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useVM } from "../../viewModel/context";
import { Loading } from "../Loading";
import { NoData } from "../NoData";
import { Documents } from ".";

export const DocumentManager = observer(() => {
  const vm = useVM();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorIndices, setErrorIndices] = useState<number[]>([]);

  // Cleanup errors on unmount
  useEffect(() => {
    return () => errorIndices.forEach((index) => vm.DismissError(index));
  }, [errorIndices]);

  useEffect(() => {
    vm.LoadMainPage().then((errorIds: number[]) => {
      setErrorIndices((prev) => {
        return [...prev, ...errorIds];
      });
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <Loading message={"Loading Documents..."} />;

  return (
    <>
      {/* Only authenticated users are allowed */}
      {vm.GetToken() ? (
        vm.User?.isAuthenticated && <Documents />
      ) : (
        //TODO: Replace with README
        <NoData message={"README"} />
      )}
    </>
  );
});

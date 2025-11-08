import React from "react";
import { createContext } from "react";
import AuthoringToolVM from "./AuthoringToolVM";

export const AOUConnectVMcontext = createContext<AuthoringToolVM>({} as AuthoringToolVM);

export interface props {
  value: AuthoringToolVM;
  children: JSX.Element;
}

const ContextProvider = ({ value, children }: props) => {
  return <AOUConnectVMcontext.Provider value={value}>{children}</AOUConnectVMcontext.Provider>;
};

export const useVM = () => React.useContext(AOUConnectVMcontext);

export default ContextProvider;

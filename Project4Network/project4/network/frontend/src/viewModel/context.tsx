import React from "react";
import { createContext } from "react";
import AOUConnectVM from "./AOUConnectVM";

export const AOUConnectVMcontext = createContext<AOUConnectVM>({} as AOUConnectVM);

export interface props {
  value: AOUConnectVM;
  children: JSX.Element;
}

const ContextProvider = ({ value, children }: props) => {
  return <AOUConnectVMcontext.Provider value={value}>{children}</AOUConnectVMcontext.Provider>;
};

export const useVM = () => React.useContext(AOUConnectVMcontext);

export default ContextProvider;

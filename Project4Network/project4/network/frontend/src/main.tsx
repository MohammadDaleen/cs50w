import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import ServiceProvider from "./ServiceProvider";
import AOUConnectVM from "./viewModel/AOUConnectVM";
import CdsService from "./cdsService/CdsService";

const serviceProvider = new ServiceProvider();
serviceProvider.register<CdsService>(CdsService.serviceName, new CdsService());
const vm: AOUConnectVM = new AOUConnectVM(serviceProvider);
serviceProvider.register<AOUConnectVM>(AOUConnectVM.serviceName, vm);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App serviceProvider={serviceProvider} />
  </StrictMode>
);

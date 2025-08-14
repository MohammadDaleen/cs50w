import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import ServiceProvider from "./ServiceProvider";
import AuthoringToolVM from "./viewModel/AuthoringToolVM";
import CdsService from "./cdsService/CdsService";

const serviceProvider = new ServiceProvider();
serviceProvider.register<CdsService>(CdsService.serviceName, new CdsService());
const vm: AuthoringToolVM = new AuthoringToolVM(serviceProvider);
serviceProvider.register<AuthoringToolVM>(AuthoringToolVM.serviceName, vm);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App serviceProvider={serviceProvider} />
  </StrictMode>
);

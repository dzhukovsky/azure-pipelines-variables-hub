import "azure-devops-ui/Core/override.css";

import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { PipelinesListingPageExample } from "./App.tsx";
import * as SDK from "azure-devops-extension-sdk";

SDK.init();

ReactDOM.render(
  <StrictMode>
    <PipelinesListingPageExample />
  </StrictMode>,
  document.getElementById("root")
);

SDK.notifyLoadSucceeded();

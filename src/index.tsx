import "azure-devops-ui/Core/override.css";

import ReactDOM from "react-dom";
import { VariablesHub } from "./VariablesHub.tsx";
import * as SDK from "azure-devops-extension-sdk";
import { SurfaceBackground, SurfaceContext } from "azure-devops-ui/Surface";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

SDK.init();

ReactDOM.render(
  <SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
    <QueryClientProvider client={queryClient}>
      <VariablesHub />
    </QueryClientProvider>
  </SurfaceContext.Provider>,
  document.getElementById("root")
);

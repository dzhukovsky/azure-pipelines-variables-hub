import 'azure-devops-ui/Core/override.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SDK from 'azure-devops-extension-sdk';
import { SurfaceBackground, SurfaceContext } from 'azure-devops-ui/Surface';
import ReactDOM from 'react-dom';
import { VariablesHub } from './VariablesHub.tsx';

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
  document.getElementById('root'),
);

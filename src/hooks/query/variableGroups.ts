import { useQuery } from '@tanstack/react-query';
import { getClient } from 'azure-devops-extension-api';
import { TaskAgentRestClient } from 'azure-devops-extension-api/TaskAgent';
import * as SDK from 'azure-devops-extension-sdk';

export const useVariableGroups = () =>
  useQuery({
    queryKey: ['variable-groups'],
    queryFn: async () => {
      await SDK.ready();

      const project = SDK.getWebContext().project;
      const client = getClient(TaskAgentRestClient);
      const variableGroups = await client.getVariableGroups(project.id);

      return variableGroups;
    },
  });

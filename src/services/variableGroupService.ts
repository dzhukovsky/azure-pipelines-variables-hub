import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";

export const getVariableGroups = async () => {
  await SDK.ready();

  const project = SDK.getWebContext().project;
  const client = getClient(TaskAgentRestClient);
  const variableGroups = await client.getVariableGroups(project.id);

  return variableGroups;
};

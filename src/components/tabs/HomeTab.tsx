import {
  getSecureFiles,
  getVariableGroups,
} from "../../services/variableGroupService";
import { LibraryItem, VariablesTree } from "../VariablesTree";
import { useQuery } from "@tanstack/react-query";
import {
  SecureFile,
  VariableGroup,
} from "azure-devops-extension-api/TaskAgent";
import { useMemo } from "react";
import {
  ITreeItem,
  TreeItemProvider,
} from "azure-devops-ui/Utilities/TreeItemProvider";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { StatusTypes } from "../TextFieldTableCell";

const loadData = async () => {
  const variableGroups = await getVariableGroups();
  const secureFiles = await getSecureFiles();
  return { variableGroups, secureFiles };
};
export const HomeTab = () => {
  console.log("Rendering HomeTab");

  const { data, isLoading, error } = useQuery({
    queryKey: ["home-tab/variable-groups-and-secure-files"],
    queryFn: loadData,
    initialData: { variableGroups: [], secureFiles: [] },
  });

  const itemProvider = useMemo(
    () => getItemProvider(data.variableGroups, data.secureFiles),
    [data]
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return <VariablesTree itemProvider={itemProvider} />;
};

const getItemProvider = (
  variableGroups: VariableGroup[],
  secureFiles: SecureFile[]
) => {
  const rootItems = [
    ...variableGroups.map<ITreeItem<LibraryItem>>((group) => ({
      data: {
        name: group.name,
        type: "group",
      },
      childItems: Object.entries(group.variables).map<ITreeItem<LibraryItem>>(
        ([name, variable]) => ({
          data: {
            name: new ObservableValue(name),
            value: new ObservableValue(variable.value),
            isSecret: variable.isSecret,
            status: new ObservableValue(StatusTypes.Untracked),
            type: "groupVariable",
          },
        })
      ),
      expanded: false,
    })),
    ...secureFiles.map<ITreeItem<LibraryItem>>((file) => ({
      data: {
        name: file.name,
        type: "file",
      },
    })),
  ];

  console.log("getItemProvider", rootItems);
  return new TreeItemProvider<LibraryItem>(rootItems);
};

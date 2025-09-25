import type {
  SecureFile,
  VariableGroup,
} from 'azure-devops-extension-api/TaskAgent';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import {
  type ITreeItem,
  TreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useMemo } from 'react';
import { useSecureFiles } from '@/hooks/query/secureFiles';
import { useVariableGroups } from '@/hooks/query/variableGroups';
import { StatusTypes } from '../TextFieldTableCell';
import { type LibraryItem, VariablesTree } from '../VariablesTree';

export const HomeTab = () => {
  const groups = useVariableGroups();
  const files = useSecureFiles();

  const isLoading = groups.isLoading || files.isLoading;
  const error = groups.error || files.error;

  const itemProvider = useMemo(
    () => getItemProvider(groups.data, files.data),
    [groups.data, files.data],
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
  secureFiles: SecureFile[],
) => {
  const rootItems = [
    ...variableGroups.map<ITreeItem<LibraryItem>>((group) => ({
      data: {
        name: group.name,
        type: 'group',
      },
      childItems: Object.entries(group.variables).map<ITreeItem<LibraryItem>>(
        ([name, variable]) => ({
          data: {
            name: new ObservableValue(name),
            value: new ObservableValue(variable.value),
            isSecret: variable.isSecret,
            status: new ObservableValue(StatusTypes.Untracked),
            type: 'groupVariable',
          },
        }),
      ),
      expanded: false,
    })),
    ...secureFiles.map<ITreeItem<LibraryItem>>((file) => ({
      data: {
        name: file.name,
        type: 'file',
      },
    })),
  ];

  return new TreeItemProvider<LibraryItem>(rootItems);
};

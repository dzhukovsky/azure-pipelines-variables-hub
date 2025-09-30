import type { VariableGroup } from 'azure-devops-extension-api/TaskAgent';
import {
  ObservableArray,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useMemo } from 'react';
import { useVariableGroups } from '@/hooks/query/variableGroups';
import type { SortFunc } from '@/hooks/sorting';
import { StatusTypes } from '../TextFieldTableCell';
import { type IVariableItem, VariablesTable } from '../VariablesTable';

const filterFunc = (item: IVariableItem, text: string) => {
  let includeItem = true;

  if (text) {
    includeItem =
      item.name.value?.toLocaleLowerCase().includes(text) ||
      item.value.value?.toLocaleLowerCase().includes(text);
  }

  return includeItem;
};

const sortFunctions: SortFunc<IVariableItem>[] = [
  (a, b) => (a.name.value ?? '').localeCompare(b.name.value ?? ''),
  (a, b) => (a.value.value ?? '').localeCompare(b.value.value ?? ''),
];

export type TableTabProps = {
  filter: IFilter;
};

export const TableTab = ({ filter }: TableTabProps) => {
  const { data, isLoading, error } = useVariableGroups();

  const variables = useMemo(() => getVariables(data ?? []), [data]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <VariablesTable
      variables={variables}
      filter={filter}
      filterFunc={filterFunc}
      sortFunctions={sortFunctions}
    />
  );
};

const getVariables = (variableGroups: VariableGroup[]) => {
  const items = variableGroups
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((vg) =>
      Object.entries(vg.variables).map<IVariableItem>(([key, value]) => ({
        name: new ObservableValue(`${key}`),
        value: new ObservableValue(value.value),
        status: new ObservableValue(StatusTypes.Untracked),
        groupName: vg.name,
        isSecret: value.isSecret,
      })),
    );

  return new ObservableArray<IVariableItem>(items);
};

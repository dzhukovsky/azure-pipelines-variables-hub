import { Button } from 'azure-devops-ui/Button';
import { Card } from 'azure-devops-ui/Card';
import {
  type IReadonlyObservableArray,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { type ITableColumn, Table, TableCell } from 'azure-devops-ui/Table';
import type { IFilter } from 'azure-devops-ui/Utilities/Filter';
import { useMemo } from 'react';
import { type FilterFunc, useFiltering } from '../hooks/filtering';
import { type SortFunc, useSorting } from '../hooks/sorting';
import { createActionColumn } from './shared/Table/createActionColumn';
import { useRowRenderer } from './shared/Table/useRowRenderer';
import {
  renderStatus,
  renderTextFieldCell,
  type Status,
  StatusTypes,
} from './TextFieldTableCell';

export interface IVariableItem {
  name: ObservableValue<string>;
  value: ObservableValue<string>;
  status?: ObservableValue<Status>;
  groupName: string;
  isSecret: boolean;
}

export interface IVariablesTableProps {
  variables: IReadonlyObservableArray<IVariableItem>;
  filter: IFilter;
  filterFunc: FilterFunc<IVariableItem>;
  sortFunctions: SortFunc<IVariableItem>[];
}

const useColumns = () => {
  const columns = useMemo<ITableColumn<IVariableItem>[]>(() => {
    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns: ITableColumn<IVariableItem>[] = [
      createActionColumn<IVariableItem>({
        id: 'name',
        name: 'Name',
        onSize,
        renderCell: (options) => renderTextFieldCell(options.item.name),
        renderActions: (options) =>
          (options.hasMouse || options.hasFocus) && (
            <Button subtle iconProps={{ iconName: 'Delete' }} />
          ),
        sortProps: {
          ariaLabelAscending: 'Sorted A to Z',
          ariaLabelDescending: 'Sorted Z to A',
        },
        width: new ObservableValue(-5),
      }),
      createActionColumn<IVariableItem>({
        id: 'value',
        name: 'Value',
        width: new ObservableValue(-15),
        renderCell: ({ item }) => renderTextFieldCell(item.value),
        renderActions: (options) =>
          ((options.hasMouse || options.hasFocus) && (
            <Button
              subtle
              iconProps={{
                iconName: options.item.isSecret ? 'Lock' : 'Unlock',
              }}
              onClick={() => {
                options.item.isSecret = !options.item.isSecret;
              }}
            />
          )) ||
          renderStatus(options.item.status),
        sortProps: {
          ariaLabelAscending: 'Sorted A to Z',
          ariaLabelDescending: 'Sorted Z to A',
        },
      }),
    ];

    return columns;
  }, []);

  return columns;
};

export const VariablesTable = ({
  variables,
  filter,
  filterFunc,
  sortFunctions,
}: IVariablesTableProps) => {
  const columns = useColumns();

  const { sortedItems, sortingBehavior } = useSorting(
    columns,
    variables,
    sortFunctions,
  );

  const { filteredItems, hasItems } = useFiltering(
    sortedItems,
    filter,
    filterFunc,
  );

  const renderRow = useRowRenderer(columns);

  return (
    (hasItems && (
      <Card
        className="flex-grow bolt-card-no-vertical-padding"
        contentProps={{ contentPadding: false }}
      >
        <Table<Partial<IVariableItem>>
          className="text-field-table-wrap focusable-text-field-rows"
          behaviors={[sortingBehavior]}
          columns={columns}
          renderRow={renderRow}
          selectRowOnClick={false}
          itemProvider={filteredItems}
          showLines={false}
        />
      </Card>
    )) || <span>No items found</span>
  );
};

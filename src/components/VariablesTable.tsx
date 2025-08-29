import {
  IReadonlyObservableArray,
  ObservableValue,
  useObservableArray,
} from "azure-devops-ui/Core/Observable";
import { Card } from "azure-devops-ui/Card";
import {
  ITableColumn,
  Table,
  ColumnSorting,
  SortOrder,
  sortItems,
} from "azure-devops-ui/Table";
import { IFilter, FILTER_CHANGE_EVENT } from "azure-devops-ui/Utilities/Filter";
import { ListSelection } from "azure-devops-ui/List";
import { Status, TextFieldTableCell } from "./TextFieldTableCell";
import { useCallback, useEffect, useMemo } from "react";

export interface IVariableItem {
  name: ObservableValue<string>;
  value: ObservableValue<string>;
  status?: ObservableValue<Status>;
}

export interface IVariablesTableProps {
  filter: IFilter;
  variables: IReadonlyObservableArray<IVariableItem>;
}

export interface IVariablesTableState {
  filtering: boolean;
  sortedItems: IVariableItem[];
  filteredItems: IVariableItem[];
}

export const VariablesTable = ({ variables, filter }: IVariablesTableProps) => {
  const [filteredItems] = useObservableArray<IVariableItem>([
    ...variables.value,
  ]);
  const [sortedItems] = useObservableArray<IVariableItem>([...variables.value]);

  const selection = useMemo(
    () =>
      new ListSelection({
        selectOnFocus: false,
        multiSelect: false,
      }),
    []
  );

  const filterItems = useCallback(
    (items: IVariableItem[]) => {
      if (filter.hasChangesToReset()) {
        const filterText = filter
          .getFilterItemValue<string>("keyword")
          ?.toLocaleLowerCase();
        const filteredItems = items.filter((item) => {
          let includeItem = true;
          if (filterText) {
            includeItem =
              item.name.value.toLocaleLowerCase().includes(filterText) ||
              item.value.value.toLocaleLowerCase().includes(filterText);
          }

          return includeItem;
        });
        return filteredItems;
      } else {
        return [...items];
      }
    },
    [filter]
  );

  useEffect(() => {
    const onVariablesChanged = () => {
      filteredItems.splice(0, filteredItems.length, ...variables.value);
      sortedItems.splice(0, sortedItems.length, ...variables.value);
    };

    variables.subscribe(onVariablesChanged);

    return () => {
      variables.unsubscribe(onVariablesChanged);
    };
  }, [filteredItems, sortedItems, variables]);

  useEffect(() => {
    const onFilterChanged = () => {
      const items = filterItems(sortedItems.value);
      filteredItems.splice(0, filteredItems.length, ...items);
    };

    filter.subscribe(onFilterChanged, FILTER_CHANGE_EVENT);

    return () => {
      filter.unsubscribe(onFilterChanged, FILTER_CHANGE_EVENT);
    };
  }, [filter, filterItems, filteredItems, sortedItems]);

  const columns = useMemo<ITableColumn<IVariableItem>[]>(() => {
    const renderNameColumn = (
      rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<IVariableItem>,
      tableItem: IVariableItem
    ) => {
      return (
        <TextFieldTableCell
          key={"col-" + columnIndex}
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          selection={selection}
          value={tableItem.name}
        />
      );
    };

    const renderValueColumn = (
      rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<IVariableItem>,
      tableItem: IVariableItem
    ) => {
      return (
        <TextFieldTableCell
          key={"col-" + columnIndex}
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          selection={selection}
          value={tableItem.value}
          status={tableItem.status}
        />
      );
    };

    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns = [
      {
        id: "name",
        name: "Name",
        onSize,
        renderCell: renderNameColumn,
        sortProps: {
          ariaLabelAscending: "Sorted A to Z",
          ariaLabelDescending: "Sorted Z to A",
        },
        width: new ObservableValue(-5),
      },
      {
        id: "value",
        name: "Value",
        width: new ObservableValue(-15),
        renderCell: renderValueColumn,
        sortProps: {
          ariaLabelAscending: "Sorted A to Z",
          ariaLabelDescending: "Sorted Z to A",
        },
      },
    ];

    return columns;
  }, [selection]);

  const sortFunctions = useMemo(
    () => [
      (item1: IVariableItem, item2: IVariableItem): number => {
        return item1.name.value.localeCompare(item2.name.value);
      },
      (item1: IVariableItem, item2: IVariableItem): number => {
        return item1.value.value.localeCompare(item2.value.value);
      },
    ],
    []
  );

  const sortingBehavior = useMemo(
    () =>
      new ColumnSorting<IVariableItem>(
        (columnIndex: number, proposedSortOrder: SortOrder) => {
          const items = sortItems(
            columnIndex,
            proposedSortOrder,
            sortFunctions,
            columns,
            sortedItems.value
          );

          sortedItems.splice(0, sortedItems.length, ...items);
          filteredItems.splice(
            0,
            filteredItems.length,
            ...filterItems(sortedItems.value)
          );
        }
      ),
    [sortFunctions, columns, sortedItems, filteredItems, filterItems]
  );

  return (
    <Card
      className="flex-grow bolt-card-no-vertical-padding"
      contentProps={{ contentPadding: false }}
    >
      <Table<Partial<IVariableItem>>
        className="text-field-table-wrap"
        behaviors={[sortingBehavior]}
        columns={columns}
        selection={selection}
        selectRowOnClick={false}
        itemProvider={filteredItems}
        showLines={false}
        onSelect={(_, data) => console.log("Selected Row - " + data.index)}
        onActivate={(_, row) => console.log("Activated Row - " + row.index)}
      />
    </Card>
  );
};

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
import { useEffect, useMemo, useState } from "react";

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

const useColumns = () => {
  const selection = useMemo(
    () =>
      new ListSelection({
        selectOnFocus: false,
        multiSelect: false,
      }),
    []
  );

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

  return { columns, selection };
};

const useFiltering = (
  variables: IReadonlyObservableArray<IVariableItem>,
  filter: IFilter
) => {
  const [hasItems, setHasItems] = useState<boolean>(variables.value.length > 0);
  const [filteredItems] = useObservableArray<IVariableItem>([
    ...variables.value,
  ]);

  useEffect(() => {
    const filterItems = (items: IVariableItem[]) => {
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
    };

    const onFilterChanged = () => {
      const items = filterItems(variables.value);
      filteredItems.splice(0, filteredItems.length, ...items);
      setHasItems(items.length > 0);
    };

    filter.subscribe(onFilterChanged, FILTER_CHANGE_EVENT);
    variables.subscribe(onFilterChanged);
    return () => {
      filter.unsubscribe(onFilterChanged, FILTER_CHANGE_EVENT);
      variables.unsubscribe(onFilterChanged);
    };
  }, [filter, filteredItems, variables]);

  return { filteredItems, hasItems };
};

const useSorting = (
  columns: ITableColumn<IVariableItem>[],
  variables: IReadonlyObservableArray<IVariableItem>
) => {
  const [sortedItems] = useObservableArray<IVariableItem>([...variables.value]);

  useEffect(() => {
    const onVariablesChanged = () => {
      sortedItems.splice(0, sortedItems.length, ...variables.value);
    };

    variables.subscribe(onVariablesChanged);
    return () => variables.unsubscribe(onVariablesChanged);
  }, [variables, sortedItems]);

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
        }
      ),
    [sortFunctions, columns, sortedItems]
  );

  return { sortedItems, sortingBehavior };
};

export const VariablesTable = ({ variables, filter }: IVariablesTableProps) => {
  const { columns, selection } = useColumns();
  const { filteredItems, hasItems } = useFiltering(variables, filter);
  const { sortedItems, sortingBehavior } = useSorting(columns, filteredItems);

  return (
    (hasItems && (
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
          itemProvider={sortedItems}
          showLines={false}
          onSelect={(_, data) => console.log("Selected Row - " + data.index)}
          onActivate={(_, row) => console.log("Activated Row - " + row.index)}
        />
      </Card>
    )) || <>No items found</>
  );
};

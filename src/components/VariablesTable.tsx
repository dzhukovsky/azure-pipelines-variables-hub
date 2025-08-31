import {
  IReadonlyObservableArray,
  ObservableValue,
} from "azure-devops-ui/Core/Observable";
import { Card } from "azure-devops-ui/Card";
import { ITableColumn, Table, TableCell } from "azure-devops-ui/Table";
import { useMemo } from "react";
import { renderTextFieldCell, Status } from "./TextFieldTableCell";
import { IFilter } from "azure-devops-ui/Utilities/Filter";
import { FilterFunc, useFiltering } from "../hooks/filtering";
import { SortFunc, useSorting } from "../hooks/sorting";

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
    const renderNameColumn = (
      _rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<IVariableItem>,
      tableItem: IVariableItem
    ) => {
      return (
        <TableCell
          key={"col-" + columnIndex}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          children={renderTextFieldCell(tableItem.name)}
        />
      );
    };

    const renderValueColumn = (
      _rowIndex: number,
      columnIndex: number,
      tableColumn: ITableColumn<IVariableItem>,
      tableItem: IVariableItem
    ) => {
      return (
        <TableCell
          key={"col-" + columnIndex}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          children={renderTextFieldCell(tableItem.value, tableItem.status)}
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
    sortFunctions
  );

  const { filteredItems, hasItems } = useFiltering(
    sortedItems,
    filter,
    filterFunc
  );

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
          selectRowOnClick={false}
          itemProvider={filteredItems}
          showLines={false}
        />
      </Card>
    )) || <>No items found</>
  );
};

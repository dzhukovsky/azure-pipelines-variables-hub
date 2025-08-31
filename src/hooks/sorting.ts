import { IReadonlyObservableArray } from "azure-devops-ui/Core/Observable";
import {
  ColumnSorting,
  ITableColumn,
  sortItems,
  SortOrder,
} from "azure-devops-ui/Table";
import { useMemo } from "react";
import { useDerivedObservableArray } from "./observable";

export type SortFunc<T> = (a: T, b: T) => number;

export function useSorting<T>(
  columns: ITableColumn<T>[],
  items: IReadonlyObservableArray<T>,
  sortFunctions: SortFunc<T>[]
) {
  const sortedItems = useDerivedObservableArray(items);

  const sortingBehavior = useMemo(
    () =>
      new ColumnSorting<T>(
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
}

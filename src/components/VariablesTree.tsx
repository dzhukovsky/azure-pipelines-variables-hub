import {
  IObservableValue,
  IReadonlyObservableArray,
  ObservableLike,
  ObservableValue,
} from "azure-devops-ui/Core/Observable";
import { Card } from "azure-devops-ui/Card";
import { IFilter } from "azure-devops-ui/Utilities/Filter";
import { renderListCell } from "azure-devops-ui/List";
import { useCallback, useEffect, useMemo } from "react";
import {
  ExpandableTreeCell,
  ITreeColumn,
  renderTreeRow,
  Tree,
  TreeRowRenderer,
} from "azure-devops-ui/TreeEx";
import {
  ITreeItem,
  TreeItemProvider,
} from "azure-devops-ui/Utilities/TreeItemProvider";
import { IVariableItem } from "./VariablesTable";
import { FilterFunc } from "../hooks/filtering";
import {
  DocumentKeyRegular,
  KeyRegular,
  LibraryFilled,
} from "@fluentui/react-icons/fonts";
import { renderTextFieldCell, Status } from "./TextFieldTableCell";
import { css } from "azure-devops-ui/Util";
import { TableCell } from "azure-devops-ui/Table";
import { SecureFile } from "azure-devops-extension-api/TaskAgent";

export interface IVariablesTreeProps {
  variables: IReadonlyObservableArray<IVariableItem>;
  secureFiles: IReadonlyObservableArray<SecureFile>;
  filter: IFilter;
  filterFunc: FilterFunc<IVariableItem>;
}

type VariableTableItem =
  | {
      name: string;
      status?: IObservableValue<Status>;
      type: "group";
    }
  | {
      name: IObservableValue<string>;
      value: IObservableValue<string>;
      isSecret: boolean;
      status?: IObservableValue<Status>;
      type: "variable";
    }
  | {
      name: string;
      status?: IObservableValue<Status>;
      type: "file";
    };

const useColumns = () => {
  const columns = useMemo(() => {
    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns: ITreeColumn<VariableTableItem>[] = [
      {
        id: "name",
        name: "Name",
        onSize,
        renderCell: (_rowIndex, columnIndex, treeColumn, treeItem) => {
          const underlyingItem = treeItem.underlyingItem;
          const data = ObservableLike.getValue(underlyingItem.data);

          return (
            <ExpandableTreeCell
              key={"col-" + columnIndex}
              contentClassName={css(data.type === "variable" && "padding-0")}
              children={
                (data.type === "group" &&
                  renderListCell({
                    text: data.name,
                    iconProps: {
                      render: (className) => (
                        <LibraryFilled
                          className={className}
                          style={{
                            color: "var(--icon-folder-color, #dcb67a)",
                          }}
                        />
                      ),
                    },
                  })) ||
                (data.type === "variable" &&
                  renderTextFieldCell(
                    data.name,
                    undefined,
                    {
                      render: data.isSecret
                        ? (className) => (
                            <KeyRegular
                              className={className}
                              style={{ paddingLeft: "2px", marginLeft: "0" }}
                            />
                          )
                        : undefined,
                      iconName: data.isSecret ? undefined : "Variable",
                      style: { paddingLeft: "0", marginLeft: "0" },
                    },
                    { readOnly: data.isSecret }
                  )) ||
                (data.type === "file" &&
                  renderListCell({
                    text: data.name,
                    iconProps: {
                      render: (className) => (
                        <DocumentKeyRegular className={className} />
                      ),
                    },
                  })) ||
                undefined
              }
              className={treeColumn.className}
              columnIndex={columnIndex}
              treeItem={treeItem}
              treeColumn={treeColumn}
            />
          );
        },
        width: new ObservableValue(-5),
      },
      {
        id: "value",
        name: "Value",
        width: new ObservableValue(-15),
        renderCell: (_rowIndex, columnIndex, treeColumn, treeItem) => {
          const underlyingItem = treeItem.underlyingItem;
          const data = ObservableLike.getValue(underlyingItem.data);

          return (
            (data.type === "variable" && (
              <TableCell
                key={"col-" + columnIndex}
                columnIndex={columnIndex}
                tableColumn={treeColumn}
                children={renderTextFieldCell(data.value, data.status)}
              />
            )) || <td key={"col-" + columnIndex} />
          );
        },
      },
    ];

    return columns;
  }, []);

  const renderRow = useCallback<TreeRowRenderer<VariableTableItem>>(
    (rowIndex, item, details) => {
      const data = ObservableLike.getValue(item.underlyingItem.data);
      const className = data.type === "variable" ? "text-field-row" : undefined;

      return renderTreeRow(rowIndex, item, details, columns, data, className);
    },
    [columns]
  );

  return { columns, renderRow };
};

const getItemProvider = (
  variables: IVariableItem[],
  secureFiles: SecureFile[]
) => {
  const groupedVariables = variables.reduce<Record<string, IVariableItem[]>>(
    (acc, variable) => {
      const group = acc[variable.groupName] || [];
      group.push(variable);
      acc[variable.groupName] = group;
      return acc;
    },
    {}
  );

  const rootItems = [
    ...Object.entries(groupedVariables).map<ITreeItem<VariableTableItem>>(
      ([groupName, variables]) => ({
        data: {
          name: groupName,
          type: "group",
        },
        childItems: variables.map<ITreeItem<VariableTableItem>>((variable) => ({
          data: {
            name: variable.name,
            value: variable.value,
            isSecret: variable.isSecret,
            status: variable.status,
            type: "variable",
          },
        })),
        expanded: false,
      })
    ),
    ...secureFiles.map<ITreeItem<VariableTableItem>>((file) => ({
      data: {
        name: file.name,
        type: "file",
      },
    })),
  ];

  return rootItems;
};

const useTreeData = (
  variables: IReadonlyObservableArray<IVariableItem>,
  secureFiles: IReadonlyObservableArray<SecureFile>
) => {
  const itemProvider = useMemo(
    () =>
      new TreeItemProvider<VariableTableItem>(
        getItemProvider(variables.value, secureFiles.value)
      ),
    [variables, secureFiles]
  );

  useEffect(() => {
    const onVariablesChanged = () => {
      itemProvider.splice(undefined, itemProvider.roots, [
        {
          items: getItemProvider(variables.value, secureFiles.value),
        },
      ]);
    };

    variables.subscribe(onVariablesChanged);
    secureFiles.subscribe(onVariablesChanged);
    return () => {
      variables.unsubscribe(onVariablesChanged);
      secureFiles.unsubscribe(onVariablesChanged);
    };
  }, [variables, itemProvider, secureFiles]);

  return { itemProvider };
};

export const VariablesTree = ({
  variables,
  secureFiles,
}: IVariablesTreeProps) => {
  const { columns, renderRow } = useColumns();
  const { itemProvider } = useTreeData(variables, secureFiles);

  return (
    <Card
      className="flex-grow bolt-card-no-vertical-padding"
      contentProps={{ contentPadding: false }}
    >
      <Tree<VariableTableItem>
        className="text-field-table-wrap"
        columns={columns}
        itemProvider={itemProvider}
        showLines={false}
        renderRow={renderRow}
        onToggle={(_, item) => {
          itemProvider.toggle(item.underlyingItem);
        }}
      />
    </Card>
  );
};

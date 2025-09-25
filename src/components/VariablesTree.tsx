import {
  DocumentKeyRegular,
  KeyRegular,
  LibraryFilled,
} from '@fluentui/react-icons/fonts';
import { Card } from 'azure-devops-ui/Card';
import {
  type IObservableValue,
  ObservableLike,
  ObservableValue,
} from 'azure-devops-ui/Core/Observable';
import { renderListCell } from 'azure-devops-ui/List';
import { TableCell } from 'azure-devops-ui/Table';
import {
  ExpandableTreeCell,
  type ITreeColumn,
  renderTreeRow,
  Tree,
  type TreeRowRenderer,
} from 'azure-devops-ui/TreeEx';
import { css } from 'azure-devops-ui/Util';
import type { ITreeItemProvider } from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useCallback, useMemo } from 'react';
import { renderTextFieldCell, type Status } from './TextFieldTableCell';

export type VariablesTreeProps = {
  itemProvider: ITreeItemProvider<LibraryItem>;
};

export type GroupItem = {
  name: string;
  status?: IObservableValue<Status>;
  type: 'group';
};

export type GroupVariableItem = {
  name: IObservableValue<string>;
  value: IObservableValue<string>;
  isSecret: boolean;
  status?: IObservableValue<Status>;
  type: 'groupVariable';
};

export type SecureFileItem = {
  name: string;
  type: 'file';
};

export type SecureFilePropertyItem = {
  name: string;
  value: string;
  type: 'fileProperty';
};

export type LibraryItem =
  | GroupItem
  | GroupVariableItem
  | SecureFileItem
  | SecureFilePropertyItem;

const useColumns = () => {
  const columns = useMemo(() => {
    const onSize = (_event: MouseEvent, index: number, width: number) => {
      (columns[index].width as ObservableValue<number>).value = width;
    };

    const columns: ITreeColumn<LibraryItem>[] = [
      {
        id: 'name',
        name: 'Name',
        onSize,
        renderCell: (_rowIndex, columnIndex, treeColumn, treeItem) => {
          const underlyingItem = treeItem.underlyingItem;
          const data = ObservableLike.getValue(underlyingItem.data);

          return (
            <ExpandableTreeCell
              key={`col-${columnIndex}`}
              contentClassName={css(
                data.type === 'groupVariable' && 'padding-0',
              )}
              className={treeColumn.className}
              columnIndex={columnIndex}
              treeItem={treeItem}
              treeColumn={treeColumn}
            >
              {(data.type === 'group' &&
                renderListCell({
                  text: data.name,
                  iconProps: {
                    render: (className) => (
                      <LibraryFilled
                        className={className}
                        style={{
                          color: 'var(--icon-folder-color, #dcb67a)',
                        }}
                      />
                    ),
                  },
                })) ||
                (data.type === 'groupVariable' &&
                  renderTextFieldCell(
                    data.name,
                    data.status,
                    {
                      render: data.isSecret
                        ? (className) => (
                            <KeyRegular
                              className={className}
                              style={{ paddingLeft: '2px', marginLeft: '0' }}
                            />
                          )
                        : undefined,
                      iconName: data.isSecret ? undefined : 'Variable',
                      style: { paddingLeft: '0', marginLeft: '0' },
                    },
                    { readOnly: data.isSecret },
                  )) ||
                (data.type === 'file' &&
                  renderListCell({
                    text: data.name,
                    iconProps: {
                      render: (className) => (
                        <DocumentKeyRegular className={className} />
                      ),
                    },
                  })) ||
                undefined}
            </ExpandableTreeCell>
          );
        },
        width: new ObservableValue(-5),
      },
      {
        id: 'value',
        name: 'Value',
        width: new ObservableValue(-15),
        renderCell: (_rowIndex, columnIndex, treeColumn, treeItem) => {
          const underlyingItem = treeItem.underlyingItem;
          const data = ObservableLike.getValue(underlyingItem.data);

          return (
            (data.type === 'groupVariable' && (
              <TableCell
                key={`col-${columnIndex}`}
                columnIndex={columnIndex}
                tableColumn={treeColumn}
              >
                {renderTextFieldCell(data.value, data.status)}
              </TableCell>
            )) || <td key={`col-${columnIndex}`} />
          );
        },
      },
    ];

    return columns;
  }, []);

  const renderRow = useCallback<TreeRowRenderer<LibraryItem>>(
    (rowIndex, item, details) => {
      const data = ObservableLike.getValue(item.underlyingItem.data);
      const className =
        data.type === 'groupVariable' ? 'text-field-row' : undefined;

      return renderTreeRow(rowIndex, item, details, columns, data, className);
    },
    [columns],
  );

  return { columns, renderRow };
};

export const VariablesTree = ({ itemProvider }: VariablesTreeProps) => {
  const { columns, renderRow } = useColumns();

  return (
    <Card
      className="flex-grow bolt-card-no-vertical-padding"
      contentProps={{ contentPadding: false }}
    >
      <Tree<LibraryItem>
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

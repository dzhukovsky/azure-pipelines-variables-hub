import {
  DocumentKeyRegular,
  KeyRegular,
  LibraryFilled,
} from '@fluentui/react-icons/fonts';
import { Button } from 'azure-devops-ui/Button';
import { Card } from 'azure-devops-ui/Card';
import {
  type IObservableValue,
  type IReadonlyObservableValue,
  ObservableLike,
  ObservableValue,
  useObservable,
} from 'azure-devops-ui/Core/Observable';
import { FocusOrMouseWithin } from 'azure-devops-ui/FocusOrMouseWithin';
import { renderListCell } from 'azure-devops-ui/List';
import { ColumnMore, TableCell, TableHeaderCell } from 'azure-devops-ui/Table';
import {
  ExpandableTreeCell,
  type ITreeColumn,
  renderTreeRow,
  Tree,
  type TreeRowRenderer,
} from 'azure-devops-ui/TreeEx';
import { css } from 'azure-devops-ui/Util';
import type {
  ITreeItemEx,
  ITreeItemProvider,
} from 'azure-devops-ui/Utilities/TreeItemProvider';
import { useCallback, useMemo, useState } from 'react';
import { createActionColumn } from './shared/Table/createActionColumn';
import { useRowRenderer } from './shared/Table/useRowRenderer';
import { createExpandableActionColumn } from './shared/Tree/createExpandableActionColumn';
import {
  renderStatus,
  renderTextFieldCell,
  type Status,
  StatusTypes,
} from './TextFieldTableCell';

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
      createExpandableActionColumn<LibraryItem>({
        id: 'name',
        name: 'Name',
        contentClassName: 'padding-vertical-0 padding-right-0',
        onSize,
        renderCell: (item) => {
          return (
            (item.type === 'group' &&
              renderListCell({
                text: item.name,
                textClassName: 'padding-vertical-8',
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
            (item.type === 'groupVariable' &&
              renderTextFieldCell(
                item.name,
                undefined,
                {
                  render: item.isSecret
                    ? (className) => (
                        <KeyRegular
                          className={className}
                          style={{ paddingLeft: '2px', marginLeft: '0' }}
                        />
                      )
                    : undefined,
                  iconName: item.isSecret ? undefined : 'Variable',
                  style: { paddingLeft: '0', marginLeft: '0' },
                },
                { readOnly: item.isSecret },
              )) ||
            (item.type === 'file' &&
              renderListCell({
                text: item.name,
                textClassName: 'padding-vertical-8',
                iconProps: {
                  render: (className) => (
                    <DocumentKeyRegular className={className} />
                  ),
                },
              })) ||
            undefined
          );
        },
        renderActions: (_rowIndex, item, hasFocus, hasMouse) =>
          (item.type === 'group' && hasMouse && (
            <Button
              subtle
              iconProps={{ iconName: 'Add' }}
              onClick={(e) => {
                console.log('Click');
                e.preventDefault();
              }}
            />
          )) ||
          (((item.type === 'groupVariable' && hasMouse) || hasFocus) && (
            <Button
              subtle
              iconProps={{ iconName: 'Delete' }}
              onClick={(e) => {
                console.log('Click');
                e.preventDefault();
              }}
            />
          )),
        width: new ObservableValue(-5),
      }),
      createActionColumn<ITreeItemEx<LibraryItem>>({
        id: 'value',
        name: 'Value',
        width: new ObservableValue(-15),
        renderCell: ({ item }) => {
          const underlyingItem = item.underlyingItem;
          const data = ObservableLike.getValue(underlyingItem.data);

          return (
            (data.type === 'groupVariable' &&
              renderTextFieldCell(data.value)) || (
              <div className="flex-row flex-grow" />
            )
          );
        },
        renderActions: ({ item, hasFocus, hasMouse }) =>
          ((hasMouse || hasFocus) && (
            <Button
              subtle
              onClick={(e) => {
                console.log('Click');
                e.preventDefault();
              }}
              iconProps={{
                iconName:
                  (item.underlyingItem.data.type === 'groupVariable' &&
                    (item.isSecret ? 'Lock' : 'Unlock')) ||
                  (item.underlyingItem.data.type === 'group' &&
                    'MoreVertical') ||
                  (item.underlyingItem.data.type === 'file' && 'MoreVertical'),
              }}
            />
          )) ||
          renderStatus(item.underlyingItem.data.status),
      }),
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
  const { columns } = useColumns();

  const renderRow = useRowRenderer(columns);

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

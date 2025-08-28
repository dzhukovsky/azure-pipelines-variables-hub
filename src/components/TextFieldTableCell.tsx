import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ListSelection } from "azure-devops-ui/List";
import { TableCell } from "azure-devops-ui/Table";
import { Observer } from "azure-devops-ui/Observer";
import {
  TextField,
  TextFieldStyle,
  TextFieldWidth,
} from "azure-devops-ui/TextField";
import { IIconProps } from "azure-devops-ui/Icon";
import { css } from "azure-devops-ui/Util";

type TextFieldTableCellProps<T> = Omit<
  React.ComponentProps<typeof TableCell<T>>,
  "children" | "className" | "ariaRowIndex"
> & {
  rowIndex: number;
  selection?: ListSelection;
  value: ObservableValue<string>;
  status?: ObservableValue<Status>;
};

export const TextFieldTableCell = <T,>({
  value,
  selection,
  rowIndex,
  status,
  ...props
}: TextFieldTableCellProps<T>) => {
  return (
    <TableCell {...props} ariaRowIndex={rowIndex}>
      <Observer status={status}>
        {(observer) => (
          <TextField
            suffixIconProps={renderStatus(observer.status)}
            className="text-field"
            inputClassName={css(
              "text-field-input",
              observer.status === "Deleted" && "status-deleted"
            )}
            disabled={observer.status === "Deleted"}
            containerClassName="text-field-container"
            width={TextFieldWidth.auto}
            style={TextFieldStyle.inline}
            value={value}
            onChange={(_, newValue) => {
              value.value = newValue;
              if (status) {
                status.value = "Modified";
              }
            }}
            onFocus={() => {
              selection?.select(rowIndex);
            }}
          ></TextField>
        )}
      </Observer>
    </TableCell>
  );
};

export type Status = "Untracked" | "Modified" | "Deleted" | "Error";
const StatusColor: Record<Status, string> = {
  Untracked: "var(--status-success-foreground)",
  Modified: "var(--status-warning-foreground)",
  Deleted: "var(--status-error-foreground)",
  Error: "var(--status-error-foreground)",
};

const renderStatus = (status?: Status): IIconProps | undefined => {
  if (!status) {
    return undefined;
  }

  if (status !== "Error") {
    return {
      render: (className) => (
        <span className={className}>
          <span
            className="text-field-status"
            style={{ color: StatusColor[status] }}
          >
            {status.charAt(0)}
          </span>
        </span>
      ),
      tooltipProps: { text: status },
    };
  }

  return {
    iconName: "Error",
    style: { color: StatusColor[status] },
    tooltipProps: { text: "Error message" },
  };
};

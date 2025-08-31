import { IObservableValue } from "azure-devops-ui/Core/Observable";
import { Observer } from "azure-devops-ui/Observer";
import {
  ITextFieldProps,
  TextField,
  TextFieldStyle,
  TextFieldWidth,
} from "azure-devops-ui/TextField";
import { IIconProps } from "azure-devops-ui/Icon";
import { css } from "azure-devops-ui/Util";
import { Tooltip } from "azure-devops-ui/TooltipEx";

export function renderTextFieldCell(
  value: IObservableValue<string>,
  status?: IObservableValue<Status>,
  iconProps?: IIconProps,
  textFieldProps?: Pick<
    ITextFieldProps,
    "placeholder" | "inputType" | "readOnly"
  >
) {
  return (
    <Observer status={status}>
      {(observer) => (
        <TextField
          {...textFieldProps}
          prefixIconProps={iconProps}
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
        ></TextField>
      )}
    </Observer>
  );
}

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
        <Tooltip text={status}>
          <span className={className}>
            <span
              className="text-field-status"
              style={{ color: StatusColor[status] }}
            >
              {status.charAt(0)}
            </span>
          </span>
        </Tooltip>
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

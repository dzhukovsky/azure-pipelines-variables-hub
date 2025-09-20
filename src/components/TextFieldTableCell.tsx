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
  status?: IObservableValue<Status | undefined>,
  iconProps?: IIconProps,
  textFieldProps?: Pick<
    ITextFieldProps,
    "placeholder" | "inputType" | "readOnly" | "required"
  >,
  onChange?: (newValue: string) => void
) {
  const placeholder =
    textFieldProps?.placeholder ||
    (textFieldProps?.inputType === "password" && "******") ||
    undefined;

  return (
    <Observer status={status}>
      {({ status }) => (
        <TextField
          {...textFieldProps}
          spellCheck={false}
          placeholder={placeholder}
          tooltipProps={{
            disabled: textFieldProps?.inputType === "password",
            overflowOnly: true,
            renderContent: () => value.value,
          }}
          prefixIconProps={iconProps}
          suffixIconProps={renderStatus(status)}
          className="text-field"
          inputClassName={css(
            "text-ellipsis text-field-input",
            status?.type === "Deleted" && "status-deleted",
            status?.type === "Error" && "input-validation-error"
          )}
          disabled={status?.type === "Deleted"}
          containerClassName="text-field-container"
          width={TextFieldWidth.auto}
          style={TextFieldStyle.inline}
          value={value}
          onChange={(_, newValue) => {
            value.value = newValue;
            onChange?.(newValue);
          }}
        ></TextField>
      )}
    </Observer>
  );
}

export type Status =
  | { type: "Untracked" | "Modified" | "Deleted" }
  | {
      type: "Error";
      message: string;
    };
const StatusColor: Record<Status["type"], string> = {
  Untracked: "var(--status-success-foreground)",
  Modified: "var(--status-warning-foreground)",
  Deleted: "var(--status-error-foreground)",
  Error: "var(--status-error-foreground)",
};

const renderStatus = (status?: Status): IIconProps | undefined => {
  if (!status) {
    return undefined;
  }

  if (status.type !== "Error") {
    return {
      render: (className) => (
        <Tooltip text={status.type}>
          <span className={className}>
            <span
              className="text-field-status"
              style={{ color: StatusColor[status.type] }}
            >
              {status.type.charAt(0)}
            </span>
          </span>
        </Tooltip>
      ),
    };
  }

  return {
    iconName: "Error",
    style: { color: StatusColor[status.type] },
    tooltipProps: { text: status.message },
  };
};

export const StatusTypes: Record<Status["type"], Status> = {
  Untracked: { type: "Untracked" },
  Modified: { type: "Modified" },
  Deleted: { type: "Deleted" },
  Error: { type: "Error", message: "Unknown error" },
};

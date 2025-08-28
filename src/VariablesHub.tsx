import "./VariablesHub.scss";

import * as React from "react";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Card } from "azure-devops-ui/Card";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import {
  ITableColumn,
  Table,
  ColumnSorting,
  SortOrder,
  sortItems,
} from "azure-devops-ui/Table";
import { Tab, TabBar } from "azure-devops-ui/Tabs";
import { InlineKeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import {
  IFilter,
  Filter,
  FILTER_CHANGE_EVENT,
} from "azure-devops-ui/Utilities/Filter";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ListSelection } from "azure-devops-ui/List";
import { Status, TextFieldTableCell } from "./components/TextFieldTableCell";

const selectedTabId = new ObservableValue<string>("home");
const filter = new Filter();

const headerCommands: IHeaderCommandBarItem[] = [
  {
    id: "new-variable-group",
    text: "New variable group",
    onActivate: () => {
      alert("New variable group");
    },
    isPrimary: true,
    important: true,
  },
  {
    id: "manage-views",
    text: "Manage views",
    onActivate: () => {
      alert("Manage views");
    },
    important: false,
  },
];

export class VariablesHub extends React.Component<{}> {
  public render() {
    return (
      <Surface background={SurfaceBackground.neutral}>
        <Page className="hub-page flex-grow">
          <Header
            title="Variables"
            titleSize={TitleSize.Large}
            commandBarItems={headerCommands}
          />
          <TabBar
            selectedTabId={selectedTabId}
            onSelectedTabChanged={this.onSelectedTabChanged}
            renderAdditionalContent={this.renderTabBarCommands}
            disableSticky={false}
          >
            <Tab id="home" name="Home" />
            <Tab id="custom" name="Custom" />
          </TabBar>
          <div className="page-content page-content-top">
            <PipelinesListingPageContent filter={filter} />
          </div>
        </Page>
      </Surface>
    );
  }

  private renderTabBarCommands = () => {
    return (
      <InlineKeywordFilterBarItem filter={filter} filterItemKey="keyword" />
    );
  };

  private onSelectedTabChanged = (newTabId: string) => {
    selectedTabId.value = newTabId;
  };
}

interface IPipelinesListingPageContentProps {
  filter: IFilter;
}

interface IPipelinesListingPageContentState {
  filtering: boolean;
  sortedItems: IVariableItem[];
  filteredItems: IVariableItem[];
}

class PipelinesListingPageContent extends React.Component<
  IPipelinesListingPageContentProps,
  IPipelinesListingPageContentState
> {
  private selection = new ListSelection({
    selectOnFocus: false,
    multiSelect: false,
  });

  private tableRef = React.createRef<Table<Partial<IVariableItem>>>();

  constructor(props: IPipelinesListingPageContentProps) {
    super(props);

    this.state = {
      filtering: false,
      filteredItems: [...variableItems],
      sortedItems: [...variableItems],
    };
  }

  render() {
    if (this.state.filtering && this.state.filteredItems.length === 0) {
      return "No pipeline items";
    }
    return (
      <Card
        className="flex-grow bolt-card-no-vertical-padding"
        contentProps={{ contentPadding: false }}
      >
        <Table<Partial<IVariableItem>>
          ref={this.tableRef}
          className="text-field-table-wrap"
          behaviors={[this.sortingBehavior]}
          columns={this.columns}
          selection={this.selection}
          selectRowOnClick={false}
          itemProvider={
            new ArrayItemProvider<IVariableItem>(this.state.filteredItems)
          }
          showLines={false}
          onSelect={(_, data) => console.log("Selected Row - " + data.index)}
          onActivate={(_, row) => console.log("Activated Row - " + row.index)}
        />
      </Card>
    );
  }

  componentDidMount() {
    this.props.filter.subscribe(this.onFilterChanged, FILTER_CHANGE_EVENT);
  }

  componentWillUnmount() {
    this.props.filter.unsubscribe(this.onFilterChanged, FILTER_CHANGE_EVENT);
  }

  private onFilterChanged = () => {
    const filteredItems = this.filterItems(this.state.sortedItems);
    this.setState({
      filtering: this.props.filter.hasChangesToReset(),
      filteredItems: filteredItems,
    });
  };

  private filterItems = (items: IVariableItem[]) => {
    if (this.props.filter.hasChangesToReset()) {
      const filterText = this.props.filter
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

  private renderNameColumn = (
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
        selection={this.selection}
        value={tableItem.name}
      />
    );
  };

  private renderValueColumn = (
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
        selection={this.selection}
        value={tableItem.value}
        status={tableItem.status}
      />
    );
  };

  private onSize = (_event: MouseEvent, index: number, width: number) => {
    (this.columns[index].width as ObservableValue<number>).value = width;
  };

  private columns: ITableColumn<IVariableItem>[] = [
    {
      id: "name",
      name: "Name",
      onSize: this.onSize,
      renderCell: this.renderNameColumn,
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
      renderCell: this.renderValueColumn,
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A",
      },
    },
  ];

  private sortFunctions = [
    // Sort on Name column
    (item1: IVariableItem, item2: IVariableItem): number => {
      return item1.name.value.localeCompare(item2.name.value);
    },
    (item1: IVariableItem, item2: IVariableItem): number => {
      return item1.value.value.localeCompare(item2.value.value);
    },
  ];

  // Create the sorting behavior (delegate that is called when a column is sorted).
  private sortingBehavior = new ColumnSorting<IVariableItem>(
    (columnIndex: number, proposedSortOrder: SortOrder) => {
      const sortedItems = sortItems(
        columnIndex,
        proposedSortOrder,
        this.sortFunctions,
        this.columns,
        this.state.sortedItems
      );
      this.setState({
        sortedItems,
        filteredItems: this.filterItems(sortedItems),
      });
    }
  );
}

const tempVariables: Record<string, string> = {
  "Environment.Name": "Production",
  "Api.BaseUrl": "https://api.example.com/v1/",
  "Api.ReadTimeoutMs": "15000",
  "Auth.Authority": "https://login.microsoftonline.com/contoso",
  "Auth.ClientId": "00000000-0000-0000-0000-000000000000",
  "Auth.RedirectUri": "https://app.example.com/auth/callback",
  "Auth.Scopes": "openid profile offline_access api.read",
  "Http.RetryCount": "3",
  "Http.RetryBackoffMs": "200,400,800",
  "Logging.MinimumLevel": "Information",
  "Logging.Endpoint": "https://ingest.example.com/telemetry",
  "FeatureFlags.EnableNewVariablesEditor": "true",
  "FeatureFlags.EnableIntelligentRouting": "false",
  "UserInterface.Theme": "Dark",
  "UserInterface.DateTimeFormat": "YYYY-MM-DD HH:mm:ss",
  "UserInterface.DefaultPageSize": "50",
  "Cdn.BaseUrl": "https://cdn.example.com/assets/2025/08/",
  "Cache.DefaultTtlMinutes": "30",
  "Telemetry.ConnectionString":
    "InstrumentationKey=00000000-0000-0000-0000-000000000000",
  "Observability.Otel.Endpoint": "https://otel.example.com/v1/traces",
  "Storage.Account": "sltpassets",
  "Storage.Container": "static",
  "Database.Server": "db-prod-01",
  "Database.Name": "AppDb",
  "Region.Primary": "westeurope",
  "Region.Fallback": "northeurope",
  "Notifications.DailyDigest": "true",
  "Email.FromAddress": "no-reply@example.com",
  "Integrations.GitHub.AppId": "123456",
  "Integrations.Slack.WebhookUrl":
    "https://hooks.slack.com/services/T000/B000/XXXX",
  "Security.Cors.AllowedOrigins":
    "https://app.example.com;https://admin.example.com",
  "Security.Csp.DefaultSrc": "'self' https://cdn.example.com",
};

const variableItems: IVariableItem[] = [];

for (let i = 0; i < 20; i++) {
  variableItems.push(
    ...Object.entries(tempVariables).map(([key, value], ii): IVariableItem => {
      const status: Status | undefined =
        ii % (i + 4) === 0
          ? "Untracked"
          : ii % (i + 1) === 1
          ? "Modified"
          : ii % (i + 2) === 2
          ? "Deleted"
          : ii % (i + 3) === 3
          ? "Error"
          : undefined;

      return {
        name: new ObservableValue(`${key}.${i}`),
        value: new ObservableValue(value),
        status: status ? new ObservableValue(status) : undefined,
      };
    })
  );
}

interface IVariableItem {
  name: ObservableValue<string>;
  value: ObservableValue<string>;
  status?: ObservableValue<Status>;
}

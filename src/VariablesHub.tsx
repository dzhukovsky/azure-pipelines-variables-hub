import "./VariablesHub.scss";

import * as React from "react";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Ago } from "azure-devops-ui/Ago";
import { Button } from "azure-devops-ui/Button";
import { Card } from "azure-devops-ui/Card";
import { Duration } from "azure-devops-ui/Duration";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { IIconProps, Icon } from "azure-devops-ui/Icon";
import { Link } from "azure-devops-ui/Link";
import { Observer } from "azure-devops-ui/Observer";
import { Page } from "azure-devops-ui/Page";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import {
  ITableColumn,
  SimpleTableCell,
  TableCell,
  Table,
  TwoLineTableCell,
  ColumnSorting,
  SortOrder,
  sortItems,
  ITableBreakpoint,
} from "azure-devops-ui/Table";
import { ScreenBreakpoints } from "azure-devops-ui/Core/Util/Screen";
import { Tab, TabBar } from "azure-devops-ui/Tabs";
import { InlineKeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { css } from "azure-devops-ui/Util";
import {
  IFilter,
  Filter,
  FILTER_CHANGE_EVENT,
} from "azure-devops-ui/Utilities/Filter";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import {
  TextField,
  TextFieldStyle,
  TextFieldWidth,
} from "azure-devops-ui/TextField";

enum PipelineStatus {
  running = "running",
  succeeded = "succeeded",
  failed = "failed",
  warning = "warning",
}

enum ReleaseType {
  prAutomated,
  tag,
  scheduled,
  manual,
}

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
            <Tab id="runs" name="Runs" />
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
  sortedItems: IPipelineItem[];
  filteredItems: IPipelineItem[];
}

class PipelinesListingPageContent extends React.Component<
  IPipelinesListingPageContentProps,
  IPipelinesListingPageContentState
> {
  constructor(props: IPipelinesListingPageContentProps) {
    super(props);

    this.state = {
      filtering: false,
      filteredItems: [...pipelineItems],
      sortedItems: [...pipelineItems],
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
        <Table<Partial<IPipelineItem>>
          className="text-field-table-wrap"
          behaviors={[this.sortingBehavior]}
          columns={this.columns}
          itemProvider={
            new ArrayItemProvider<IPipelineItem>(this.state.filteredItems)
          }
          showLines={true}
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

  private filterItems = (items: IPipelineItem[]) => {
    if (this.props.filter.hasChangesToReset()) {
      const filterText =
        this.props.filter.getFilterItemValue<string>("keyword");
      const statuses =
        this.props.filter.getFilterItemValue<PipelineStatus[]>("status");
      const filteredItems = items.filter((item) => {
        let includeItem = true;
        if (filterText) {
          includeItem = item.name.indexOf(filterText) !== -1;
        }
        if (includeItem && statuses && statuses.length) {
          includeItem = statuses.some((s) => s === item.status);
        }
        return includeItem;
      });
      return filteredItems;
    } else {
      return [...items];
    }
  };

  private sortFunctions = [
    // Sort on Name column
    (item1: IPipelineItem, item2: IPipelineItem): number => {
      return item1.name.localeCompare(item2.name);
    },
  ];

  // Create the sorting behavior (delegate that is called when a column is sorted).
  private sortingBehavior = new ColumnSorting<IPipelineItem>(
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

  private columns: ITableColumn<IPipelineItem>[] = [
    {
      id: "name",
      name: "Name",
      readonly: true,
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
    },
  ];
}

function modifyNow(
  days: number,
  hours: number,
  minutes: number,
  seconds: number
): Date {
  const now = new Date();
  const newDate = new Date(now as any);
  newDate.setDate(now.getDate() + days);
  newDate.setHours(now.getHours() + hours);
  newDate.setMinutes(now.getMinutes() + minutes);
  newDate.setSeconds(now.getSeconds() + seconds);
  return newDate;
}

function renderNameColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  return (
    <SimpleTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
    >
      <TextField
        className="text-field"
        containerClassName="text-field-container"
        width={TextFieldWidth.auto}
        style={TextFieldStyle.inline}
        value={tableItem.name}
      ></TextField>
    </SimpleTableCell>
  );
}

function renderValueColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  return (
    <SimpleTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
    >
      <TextField
        className="text-field"
        containerClassName="text-field-container"
        width={TextFieldWidth.auto}
        style={TextFieldStyle.inline}
        value={tableItem.lastRunData.prName}
      ></TextField>
    </SimpleTableCell>
  );
}

const tempPipelineItems = [
  {
    name: "enterprise-distributed-service",
    status: PipelineStatus.running,
    lastRunData: {
      prId: 482,
      prName: "Added testing for get_service_instance_stats",
      startTime: modifyNow(0, -1, 0, 0),
      endTime: modifyNow(0, -1, 23, 8),
      releaseType: ReleaseType.prAutomated,
      branchName: "master",
    },
    favorite: new ObservableValue<boolean>(true),
  },
  {
    name: "microservice-architecture",
    status: PipelineStatus.succeeded,
    lastRunData: {
      prId: 137,
      prName: "Update user service",
      startTime: modifyNow(-1, 0, 0, 0),
      endTime: modifyNow(-1, 0, 5, 2),
      releaseType: ReleaseType.tag,
      branchName: "master",
    },
    favorite: new ObservableValue<boolean>(true),
  },
  {
    name: "mobile-ios-app",
    status: PipelineStatus.succeeded,
    lastRunData: {
      prId: 32,
      prName: "Update user service",
      startTime: modifyNow(0, -2, 0, 0),
      endTime: modifyNow(0, -2, 33, 1),
      releaseType: ReleaseType.scheduled,
      branchName: "master",
    },
    favorite: new ObservableValue<boolean>(false),
  },
  {
    name: "node-package",
    status: PipelineStatus.succeeded,
    lastRunData: {
      prId: 385,
      prName: "Add a request body validator",
      startTime: modifyNow(0, -4, 0, 0),
      endTime: modifyNow(0, -4, 4, 17),
      releaseType: ReleaseType.prAutomated,
      branchName: "test",
    },
    favorite: new ObservableValue<boolean>(false),
  },
  {
    name: "parallel-stages",
    status: PipelineStatus.failed,
    lastRunData: {
      prId: 792,
      prName: "Clean up notifications styling",
      startTime: modifyNow(0, -6, 0, 0),
      endTime: modifyNow(0, -6, 2, 8),
      releaseType: ReleaseType.manual,
      branchName: "develop",
    },
    favorite: new ObservableValue<boolean>(false),
  },
  {
    name: "simple-web-app",
    status: PipelineStatus.warning,
    lastRunData: {
      prId: 283,
      prName: "Add extra padding on cells",
      startTime: modifyNow(-2, 0, 0, 0),
      endTime: modifyNow(-2, 0, 49, 52),
      releaseType: ReleaseType.prAutomated,
      branchName: "feature-123",
    },
    favorite: new ObservableValue<boolean>(false),
  },
];

const pipelineItems: IPipelineItem[] = [];

for (let i = 0; i < 100; i++) {
  pipelineItems.push(...tempPipelineItems);
}

interface IPipelineLastRun {
  startTime?: Date;
  endTime?: Date;
  prId: number;
  prName: string;
  releaseType: ReleaseType;
  branchName: string;
}

interface IPipelineItem {
  name: string;
  status: PipelineStatus;
  lastRunData: IPipelineLastRun;
  favorite: ObservableValue<boolean>;
}

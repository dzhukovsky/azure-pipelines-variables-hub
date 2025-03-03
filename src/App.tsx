import * as React from "react";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Ago } from "azure-devops-ui/Ago";
import { Button } from "azure-devops-ui/Button";
import { Card } from "azure-devops-ui/Card";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Duration } from "azure-devops-ui/Duration";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { Header, TitleSize } from "azure-devops-ui/Header";
import {
  IHeaderCommandBarItem,
  HeaderCommandBarWithFilter,
} from "azure-devops-ui/HeaderCommandBar";
import { IIconProps, Icon } from "azure-devops-ui/Icon";
import { Link } from "azure-devops-ui/Link";
import { Observer } from "azure-devops-ui/Observer";
import { Page } from "azure-devops-ui/Page";
import { DropdownFilterBarItem } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import {
  Status,
  Statuses,
  StatusSize,
  IStatusProps,
} from "azure-devops-ui/Status";
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
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { css } from "azure-devops-ui/Util";
import {
  IFilter,
  Filter,
  FILTER_CHANGE_EVENT,
} from "azure-devops-ui/Utilities/Filter";
import { DropdownMultiSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";

import "./App.scss";

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
const filterToggled = new ObservableValue<boolean>(false);
const filter = new Filter();
const dropdownSelection = new DropdownMultiSelection();

const headerCommands: IHeaderCommandBarItem[] = [
  {
    id: "new-pipeline",
    text: "New pipeline",
    onActivate: () => {
      alert("New pipeline");
    },
    important: true,
  },
];

const tabBarCommands: IHeaderCommandBarItem[] = [
  {
    ariaLabel: "Home",
    id: "view-toggle",
    onActivate: () => {
      alert("Toggle View");
    },
    iconProps: {
      iconName: "Home",
    },
    important: true,
    subtle: true,
    tooltipProps: { text: "Home" },
  },
];

export class PipelinesListingPageExample extends React.Component<{}> {
  public render() {
    return (
      <Surface background={SurfaceBackground.neutral}>
        <Page className="flex-grow">
          <Header
            title="Pipelines"
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
          <ConditionalChildren renderChildren={filterToggled}>
            <div className="page-content-left page-content-right page-content-top">
              <FilterBar
                filter={filter}
                onDismissClicked={this.onFilterBarDismissClicked}
              >
                <KeywordFilterBarItem filterItemKey="keyword" />
                <DropdownFilterBarItem
                  filterItemKey="status"
                  filter={filter}
                  items={this.getStatuses().map(this.getStatusListItem)}
                  selection={dropdownSelection}
                  placeholder="Status"
                />
              </FilterBar>
            </div>
          </ConditionalChildren>
          <div className="page-content page-content-top">
            <PipelinesListingPageContent filter={filter} />
          </div>
        </Page>
      </Surface>
    );
  }

  private onFilterBarDismissClicked = () => {
    filterToggled.value = !filterToggled.value;
  };

  private renderTabBarCommands = () => {
    return (
      <HeaderCommandBarWithFilter
        filter={filter}
        filterToggled={filterToggled}
        items={tabBarCommands}
      />
    );
  };

  private onSelectedTabChanged = (newTabId: string) => {
    selectedTabId.value = newTabId;
  };

  private getStatuses = () => {
    return [
      PipelineStatus.succeeded,
      PipelineStatus.failed,
      PipelineStatus.warning,
      PipelineStatus.running,
    ];
  };
  private getStatusListItem = (
    status: PipelineStatus
  ): IListBoxItem<PipelineStatus> => {
    const statusDetail = getStatusIndicatorData(status);

    return {
      data: status,
      id: status,
      text: statusDetail.label,
      iconProps: {
        render: (className) => (
          <Status
            {...statusDetail.statusProps}
            className={css(className, statusDetail.statusProps.className)}
            size={StatusSize.m}
            animated={false}
          />
        ),
      },
    };
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
          behaviors={[this.sortingBehavior]}
          columns={this.columns}
          itemProvider={
            new ArrayItemProvider<IPipelineItem>(this.state.filteredItems)
          }
          showLines={true}
          onSelect={(_, data) => console.log("Selected Row - " + data.index)}
          onActivate={(_, row) => console.log("Activated Row - " + row.index)}
          tableBreakpoints={this.tableBreakpoints}
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
    (
      columnIndex: number,
      proposedSortOrder: SortOrder,
      _event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>
    ) => {
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

  private tableBreakpoints: ITableBreakpoint[] = [
    {
      breakpoint: ScreenBreakpoints.xsmall,
      columnWidths: [0, 0, -78, 0, 0, -22],
    },
    {
      breakpoint: ScreenBreakpoints.small,
      columnWidths: [-40, -35, 0, -20, -5, 0],
    },
  ];

  private columns: ITableColumn<IPipelineItem>[] = [
    {
      id: "name",
      name: "Pipeline",
      readonly: true,
      renderCell: renderNameColumn,
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A",
      },
      width: new ObservableValue(-16),
    },
    {
      id: "lastRun",
      name: "Last run",
      width: new ObservableValue(-16),
      renderCell: renderLastRunColumn,
      className: "pipelines-two-line-cell",
    },
    {
      id: "nameWithDetails",
      width: new ObservableValue(-16),
      renderCell: renderNameWithDetailsColumn,
      className: "pipelines-two-line-cell",
      ariaLabel: "Name with details",
    },
    {
      id: "time",
      readonly: true,
      renderCell: renderDateColumn,
      width: new ObservableValue(-16),
      ariaLabel: "Time and duration",
    },
    {
      id: "favorite",
      renderCell: renderFavoritesColumn,
      width: new ObservableValue(-16),
      ariaLabel: "Favorite",
    },
    {
      id: "timeWithFavorite",
      renderCell: renderDateWithFavoritesColumn,
      width: new ObservableValue(-16),
      ariaLabel: "Time with favorite",
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
      contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
    >
      <Status
        {...getStatusIndicatorData(tableItem.status).statusProps}
        className="icon-large-margin"
        size={StatusSize.l}
      />
      <div className="flex-row scroll-hidden wrap-text">
        <Tooltip text={tableItem.name}>
          <span>{tableItem.name}</span>
        </Tooltip>
      </div>
    </SimpleTableCell>
  );
}

function renderLastRunColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  const { prName, prId, releaseType, branchName } = tableItem.lastRunData;
  const text = "#" + prId + " \u00b7 " + prName;
  const releaseTypeText = ReleaseTypeText({ releaseType: releaseType });
  const tooltip = `${releaseTypeText} from ${branchName} branch`;
  return (
    <TwoLineTableCell
      className="bolt-table-cell-content-with-inline-link no-v-padding"
      key={"col-" + columnIndex}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      line1={
        <span className="flex-row scroll-hidden">
          <Tooltip text={text}>
            <Link
              className="fontSizeM font-size-m wrap-text bolt-table-link bolt-table-inline-link"
              excludeTabStop
              href="#pr"
            >
              {text}
            </Link>
          </Tooltip>
        </span>
      }
      line2={
        <Tooltip text={tooltip}>
          <span className="fontSize font-size secondary-text flex-row flex-baseline wrap-text">
            {ReleaseTypeIcon({ releaseType: releaseType })}
            <span key="release-type-text">{releaseTypeText}</span>
            <Link
              className="monospaced-text wrap-text flex-row flex-baseline bolt-table-link bolt-table-inline-link"
              excludeTabStop
              href="#branch"
            >
              {Icon({
                className: "icon-margin",
                iconName: "OpenSource",
                key: "branch-name",
              })}
              {branchName}
            </Link>
          </span>
        </Tooltip>
      }
    />
  );
}

function renderNameWithDetailsColumn(
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  const { prName, prId } = tableItem.lastRunData;
  const lastRunText = "#" + prId + " \u00b7 " + prName;

  const lastRun = (
    <Tooltip text={lastRunText} overflowOnly>
      <span className="body-s flex-row flex-baseline wrap-text">
        {lastRunText}
      </span>
    </Tooltip>
  );

  return (
    <TwoLineTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
      line1={renderNameColumn(rowIndex, columnIndex, tableColumn, tableItem)}
      line2={lastRun}
    />
  );
}

function renderDateColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  return (
    <TwoLineTableCell
      key={"col-" + columnIndex}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      line1={WithIcon({
        className: "fontSize font-size",
        iconProps: { iconName: "Calendar" },
        children: (
          <Ago
            date={
              tableItem.lastRunData.startTime!
            } /*format={AgoFormat.Extended}*/
          />
        ),
      })}
      line2={WithIcon({
        className: "fontSize font-size bolt-table-two-line-cell-item",
        iconProps: { iconName: "Clock" },
        children: (
          <Duration
            startDate={tableItem.lastRunData.startTime!}
            endDate={tableItem.lastRunData.endTime}
          />
        ),
      })}
    />
  );
}

function renderFavoritesColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  return (
    <TableCell
      className="bolt-table-cell-side-action"
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
    >
      <div className="bolt-list-cell-content flex-column">
        <Observer favorite={tableItem.favorite}>
          {(props: { favorite: boolean }) => {
            return (
              <Button
                ariaLabel={"Favorite"}
                ariaPressed={props.favorite}
                className={css(
                  !props.favorite && "bolt-table-cell-content-reveal"
                )}
                excludeTabStop={true}
                iconProps={{
                  iconName: props.favorite
                    ? "FavoriteStarFill"
                    : "FavoriteStar",
                  className: props.favorite ? "yellow" : undefined,
                }}
                onClick={(e) => {
                  tableItem.favorite.value = !tableItem.favorite.value;
                  e.preventDefault();
                }}
                subtle
              />
            );
          }}
        </Observer>
      </div>
    </TableCell>
  );
}

function renderDateWithFavoritesColumn(
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  return (
    <TwoLineTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
      line1={WithIcon({
        className: "fontSize font-size",
        iconProps: { iconName: "Calendar" },
        children: (
          <Ago
            date={
              tableItem.lastRunData.startTime!
            } /*format={AgoFormat.Extended}*/
          />
        ),
      })}
      line2={renderFavoritesColumn(
        rowIndex,
        columnIndex,
        tableColumn,
        tableItem
      )}
    />
  );
}

function WithIcon(props: {
  className?: string;
  iconProps: IIconProps;
  children?: React.ReactNode;
}) {
  return (
    <div className={css(props.className, "flex-row flex-center")}>
      {Icon({ ...props.iconProps, className: "icon-margin" })}
      {props.children}
    </div>
  );
}

function ReleaseTypeIcon(props: { releaseType: ReleaseType }) {
  let iconName: string = "";
  switch (props.releaseType) {
    case ReleaseType.prAutomated:
      iconName = "BranchPullRequest";
      break;
    default:
      iconName = "Tag";
  }

  return Icon({
    className: "bolt-table-inline-link-left-padding icon-margin",
    iconName: iconName,
    key: "release-type",
  });
}

function ReleaseTypeText(props: { releaseType: ReleaseType }) {
  switch (props.releaseType) {
    case ReleaseType.prAutomated:
      return "PR Automated";
    case ReleaseType.manual:
      return "Manually triggered";
    case ReleaseType.scheduled:
      return "Scheduled";
    default:
      return "Release new-features";
  }
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

interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
}

function getStatusIndicatorData(status: string): IStatusIndicatorData {
  status = status || "";
  status = status.toLowerCase();
  let indicatorData: IStatusIndicatorData = {
    statusProps: Statuses.Success,
    label: "Success",
  };
  switch (status) {
    case PipelineStatus.failed:
      indicatorData.statusProps = Statuses.Failed;
      indicatorData.label = "Failed";
      break;
    case PipelineStatus.running:
      indicatorData.statusProps = Statuses.Running;
      indicatorData.label = "Running";
      break;
    case PipelineStatus.warning:
      indicatorData.statusProps = Statuses.Warning;
      indicatorData.label = "Warning";

      break;
  }

  return indicatorData;
}

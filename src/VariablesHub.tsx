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
import { getVariableGroups } from "./services/variableGroupService";

interface IVariableItem {
  name: ObservableValue<string>;
  value: ObservableValue<string>;
  status?: ObservableValue<Status>;
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

    getVariableGroups().then((vgs) => {
      var variables = Object.entries(vgs[0].variables).map<IVariableItem>(
        ([key, value]) => ({
          name: new ObservableValue(`${key}`),
          value: new ObservableValue(value.value),
          status: new ObservableValue("Untracked"),
        })
      );

      this.setState({
        sortedItems: variables,
        filteredItems: variables,
      });
    });

    this.state = {
      filtering: false,
      filteredItems: [],
      sortedItems: [],
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

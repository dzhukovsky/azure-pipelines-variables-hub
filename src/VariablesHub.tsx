import "./VariablesHub.scss";

import {
  ObservableValue,
  useObservable,
  useObservableArray,
} from "azure-devops-ui/Core/Observable";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Observer } from "azure-devops-ui/Observer";
import { Tab, TabBar } from "azure-devops-ui/Tabs";
import { InlineKeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { IVariableItem, VariablesTable } from "./components/VariablesTable";
import { getVariableGroups } from "./services/variableGroupService";
import { useCallback, useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import { VariablesTree } from "./components/VariablesTree";
import { SortFunc } from "./hooks/sorting";

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

const filterFunc = (item: IVariableItem, text: string) => {
  let includeItem = true;

  if (text) {
    includeItem =
      item.name.value?.toLocaleLowerCase().includes(text) ||
      item.value.value?.toLocaleLowerCase().includes(text);
  }

  return includeItem;
};

const sortFunctions: SortFunc<IVariableItem>[] = [
  (a, b) => (a.name.value ?? "").localeCompare(b.name.value ?? ""),
  (a, b) => (a.value.value ?? "").localeCompare(b.value.value ?? ""),
];

export const VariablesHub = () => {
  const [filter] = useState<Filter>(new Filter());
  const [selectedTabId] = useObservable<string>("home");
  const [variables] = useObservableArray<IVariableItem>([]);

  useEffect(() => {
    getVariableGroups().then((vgs) => {
      const items = vgs
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap((vg) =>
          Object.entries(vg.variables).map<IVariableItem>(([key, value]) => ({
            name: new ObservableValue(`${key}`),
            value: new ObservableValue(value.value),
            status: new ObservableValue("Untracked"),
            groupName: vg.name,
            isSecret: value.isSecret,
          }))
        );

      variables.splice(0, variables.length, ...items);
      SDK.notifyLoadSucceeded();
    });
  }, [variables]);

  const onSelectedTabChanged = useCallback(
    (newTabId: string) => {
      selectedTabId.value = newTabId;
    },
    [selectedTabId]
  );

  const renderTabBarCommands = useCallback(() => {
    return (
      <InlineKeywordFilterBarItem filter={filter} filterItemKey="keyword" />
    );
  }, [filter]);

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
          onSelectedTabChanged={onSelectedTabChanged}
          renderAdditionalContent={renderTabBarCommands}
          disableSticky={false}
        >
          <Tab id="home" name="Home" />
          <Tab id="custom" name="Custom" />
        </TabBar>
        <div className="page-content page-content-top">
          <Observer selectedTabId={selectedTabId}>
            {({ selectedTabId }) =>
              (selectedTabId === "home" && (
                <VariablesTree
                  variables={variables}
                  filter={filter}
                  filterFunc={filterFunc}
                />
              )) ||
              (selectedTabId === "custom" && (
                <VariablesTable
                  variables={variables}
                  filter={filter}
                  filterFunc={filterFunc}
                  sortFunctions={sortFunctions}
                />
              ))
            }
          </Observer>
        </div>
      </Page>
    </Surface>
  );
};

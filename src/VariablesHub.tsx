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
import {
  getSecureFiles,
  getVariableGroups,
} from "./services/variableGroupService";
import { useCallback, useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import { VariablesTree } from "./components/VariablesTree";
import { SortFunc } from "./hooks/sorting";
import { SplitButton } from "azure-devops-ui/SplitButton";
import { VariablesMatrix } from "./components/VariablesMatrix";
import {
  SecureFile,
  VariableGroup,
} from "azure-devops-extension-api/TaskAgent";
import { StatusTypes } from "./components/TextFieldTableCell";

const headerCommands: IHeaderCommandBarItem[] = [
  {
    id: "new-variable-group",
    important: true,
    renderButton: ({ id }) => (
      <SplitButton
        key={id}
        primary={true}
        buttonProps={{
          text: "New variable group",
          onClick: () => {
            alert("New variable group");
          },
        }}
        menuButtonProps={{
          ariaLabel: "See options",
          contextualMenuProps: {
            menuProps: {
              id: "2",
              items: [
                {
                  id: "new-secure-file",
                  text: "New secure file",
                  onActivate: () => {
                    alert("New secure file");
                  },
                },
              ],
            },
          },
        }}
      />
    ),
  },
  {
    id: "history",
    text: "History",
    onActivate: () => {
      alert("History");
    },
    important: false,
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

const loadData = async () => {
  const variableGroups = await getVariableGroups();
  const secureFiles = await getSecureFiles();
  return { variableGroups, secureFiles };
};

export const VariablesHub = () => {
  const [filter] = useState<Filter>(new Filter());
  const [selectedTabId] = useObservable<string>("home");
  const [variableGroups, setVariableGroups] = useState<VariableGroup[]>([]);
  const [variables] = useObservableArray<IVariableItem>([]);
  const [secureFilesData] = useObservableArray<SecureFile>([]);

  useEffect(() => {
    loadData()
      .then(({ variableGroups, secureFiles }) => {
        setVariableGroups(variableGroups);
        const items = variableGroups
          .sort((a, b) => a.name.localeCompare(b.name))
          .flatMap((vg) =>
            Object.entries(vg.variables).map<IVariableItem>(([key, value]) => ({
              name: new ObservableValue(`${key}`),
              value: new ObservableValue(value.value),
              status: new ObservableValue(StatusTypes.Untracked),
              groupName: vg.name,
              isSecret: value.isSecret,
            }))
          );

        variables.splice(0, variables.length, ...items);
        secureFilesData.splice(0, secureFilesData.length, ...secureFiles);
        SDK.notifyLoadSucceeded();
      })
      .catch(console.error);
  }, [variables, secureFilesData]);

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
          <Tab id="table" name="Table" />
          <Tab id="matrix" name="Matrix" />
        </TabBar>
        <div className="page-content page-content-top">
          <Observer selectedTabId={selectedTabId}>
            {({ selectedTabId }) =>
              (selectedTabId === "home" && (
                <VariablesTree
                  variables={variables}
                  filter={filter}
                  secureFiles={secureFilesData}
                  filterFunc={filterFunc}
                />
              )) ||
              (selectedTabId === "table" && (
                <VariablesTable
                  variables={variables}
                  filter={filter}
                  filterFunc={filterFunc}
                  sortFunctions={sortFunctions}
                />
              )) ||
              (selectedTabId === "matrix" && (
                <VariablesMatrix
                  variableGroups={variableGroups}
                  filter={filter}
                />
              ))
            }
          </Observer>
        </div>
      </Page>
    </Surface>
  );
};

import "./VariablesHub.scss";

import { useObservable } from "azure-devops-ui/Core/Observable";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Observer } from "azure-devops-ui/Observer";
import { Tab, TabBar } from "azure-devops-ui/Tabs";
import { InlineKeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { useCallback, useState } from "react";
import { SplitButton } from "azure-devops-ui/SplitButton";
import { HomeTab } from "./components/tabs/HomeTab";
import { MatrixTab } from "./components/tabs/MatrixTab";
import { TableTab } from "./components/tabs/TableTab";

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

export const VariablesHub = () => {
  const [filter] = useState(new Filter());
  const [selectedTabId] = useObservable("home");

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
          title="Library"
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
              (selectedTabId === "home" && <HomeTab />) ||
              (selectedTabId === "table" && <TableTab filter={filter} />) ||
              (selectedTabId === "matrix" && <MatrixTab filter={filter} />)
            }
          </Observer>
        </div>
      </Page>
    </Surface>
  );
};

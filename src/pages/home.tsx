import './home.scss';

import {} from 'azure-devops-extension-sdk';
import {
  useObservable,
  useSubscription,
} from 'azure-devops-ui/Core/Observable';
import { Header, TitleSize } from 'azure-devops-ui/Header';
import type { IHeaderCommandBarItem } from 'azure-devops-ui/HeaderCommandBar';
import { Observer } from 'azure-devops-ui/Observer';
import { Page } from 'azure-devops-ui/Page';
import { SplitButton } from 'azure-devops-ui/SplitButton';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { Tab, TabBar } from 'azure-devops-ui/Tabs';
import { InlineKeywordFilterBarItem } from 'azure-devops-ui/TextFilterBarItem';
import { Filter } from 'azure-devops-ui/Utilities/Filter';
import { useCallback, useEffect, useState } from 'react';
import { HomeTab } from '@/components/tabs/HomeTab';
import { MatrixTab } from '@/components/tabs/MatrixTab';
import { TableTab } from '@/components/tabs/TableTab';
import { useFilterSubscription } from '@/hooks/filtering';
import { useNavigationService } from '@/hooks/query/navigation';

const headerCommands: IHeaderCommandBarItem[] = [
  {
    id: 'new-variable-group',
    important: true,
    renderButton: ({ id }) => (
      <SplitButton
        key={id}
        primary={true}
        buttonProps={{
          text: 'New variable group',
          onClick: () => {
            alert('New variable group');
          },
        }}
        menuButtonProps={{
          ariaLabel: 'See options',
          contextualMenuProps: {
            menuProps: {
              id: '2',
              items: [
                {
                  id: 'new-secure-file',
                  text: 'New secure file',
                  onActivate: () => {
                    alert('New secure file');
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
    id: 'history',
    text: 'History',
    onActivate: () => {
      alert('History');
    },
    important: false,
  },
  {
    id: 'manage-views',
    text: 'Manage views',
    onActivate: () => {
      alert('Manage views');
    },
    important: false,
  },
];

export const HomePage = () => {
  const { queryParams, isLoading, setQueryParams } = useNavigationService({
    tab: 'home',
    filter: '',
  });

  const [filter] = useState(
    new Filter({ defaultState: { keyword: { value: queryParams.filter } } }),
  );

  if (filter.getFilterItemValue('keyword') !== queryParams.filter) {
    filter.setFilterItemState('keyword', { value: queryParams.filter });
  }

  useFilterSubscription(filter, () => {
    setQueryParams({ filter: filter.getFilterItemValue('keyword') }, false);
  });

  const renderTabBarCommands = useCallback(
    () => (
      <InlineKeywordFilterBarItem filter={filter} filterItemKey="keyword" />
    ),
    [filter],
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Surface background={SurfaceBackground.neutral}>
      <Page className="hub-page flex-grow">
        <Header
          title="Library"
          titleSize={TitleSize.Large}
          commandBarItems={headerCommands}
        />
        <TabBar
          selectedTabId={queryParams.tab}
          onSelectedTabChanged={(tab) => setQueryParams({ tab })}
          renderAdditionalContent={renderTabBarCommands}
          disableSticky={false}
        >
          <Tab id={'home'} name="Home" />
          <Tab id={'table'} name="Table" />
          <Tab id={'matrix'} name="Matrix" />
        </TabBar>
        <div className="page-content page-content-top">
          {(queryParams.tab === 'home' && <HomeTab />) ||
            (queryParams.tab === 'table' && <TableTab filter={filter} />) ||
            (queryParams.tab === 'matrix' && <MatrixTab filter={filter} />)}
        </div>
      </Page>
    </Surface>
  );
};

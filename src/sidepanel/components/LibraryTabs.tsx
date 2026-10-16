import { useState } from 'react';
import type { PinLibrary } from '../../library/librarySchema';
import { PinsTab } from './PinsTab';
import { SetsTab } from './SetsTab';

type LibraryTabsProps = {
  readonly library: PinLibrary;
};

const LibraryTab = {
  Pins: 'pins',
  Sets: 'sets',
} as const;
type LibraryTab = (typeof LibraryTab)[keyof typeof LibraryTab];

export function LibraryTabs({ library }: LibraryTabsProps) {
  const [selectedTab, setSelectedTab] = useState<LibraryTab>(LibraryTab.Pins);
  const tabs = [
    { id: LibraryTab.Pins, label: 'Pins', count: library.pins.length },
    { id: LibraryTab.Sets, label: 'Sets', count: library.sets.length },
  ];

  return (
    <div className="library-tabs">
      <div className="tabs" role="tablist" aria-label="Library">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="tab"
            aria-selected={selectedTab === tab.id}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
            <span className="count">{tab.count}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {selectedTab === LibraryTab.Pins ? (
          <PinsTab pins={library.pins} />
        ) : (
          <SetsTab library={library} />
        )}
      </div>
    </div>
  );
}

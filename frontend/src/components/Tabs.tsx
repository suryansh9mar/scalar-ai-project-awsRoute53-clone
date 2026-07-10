"use client";

import CTabs, { type TabsProps } from "@cloudscape-design/components/tabs";

export interface Tab {
  id: string;
  label: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  const cloudscapeTabs: TabsProps.Tab[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    content: null,
  }));

  return (
    <CTabs
      tabs={cloudscapeTabs}
      activeTabId={active}
      onChange={({ detail }) => onChange(detail.activeTabId)}
      variant="default"
    />
  );
}

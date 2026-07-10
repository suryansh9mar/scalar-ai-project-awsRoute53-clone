"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { SplitPanelProps } from "@cloudscape-design/components/split-panel";

interface SplitPanelContextValue {
  splitPanelOpen: boolean;
  setSplitPanelOpen: (open: boolean) => void;
  splitPanelContent: ReactNode | null;
  setSplitPanelContent: (content: ReactNode | null) => void;
  splitPanelHeader: string | null;
  setSplitPanelHeader: (header: string | null) => void;
}

const SplitPanelContext = createContext<SplitPanelContextValue | null>(null);

export function SplitPanelProvider({ children }: { children: ReactNode }) {
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  const [splitPanelContent, setSplitPanelContent] = useState<ReactNode | null>(null);
  const [splitPanelHeader, setSplitPanelHeader] = useState<string | null>(null);

  return (
    <SplitPanelContext.Provider
      value={{
        splitPanelOpen,
        setSplitPanelOpen,
        splitPanelContent,
        setSplitPanelContent,
        splitPanelHeader,
        setSplitPanelHeader,
      }}
    >
      {children}
    </SplitPanelContext.Provider>
  );
}

export function useSplitPanel() {
  const ctx = useContext(SplitPanelContext);
  if (!ctx) throw new Error("useSplitPanel must be used within a SplitPanelProvider");
  return ctx;
}

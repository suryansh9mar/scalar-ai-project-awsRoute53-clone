"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SideNavContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SideNavContext = createContext<SideNavContextValue | null>(null);

export function SideNavProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("aws-sidenav-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("aws-sidenav-collapsed", String(next));
      return next;
    });
  }, []);

  return (
    <SideNavContext.Provider value={{ collapsed, toggleCollapsed }}>
      {children}
    </SideNavContext.Provider>
  );
}

export function useSideNav(): SideNavContextValue {
  const ctx = useContext(SideNavContext);
  if (!ctx) throw new Error("useSideNav must be used within a SideNavProvider");
  return ctx;
}

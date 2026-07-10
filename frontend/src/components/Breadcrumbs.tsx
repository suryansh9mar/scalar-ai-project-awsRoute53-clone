"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";

export interface Crumb {
  label: string;
  href?: string;
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

interface BreadcrumbContextValue {
  crumbs: Crumb[];
  setCrumbs: (crumbs: Crumb[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [crumbs, setCrumbsState] = useState<Crumb[]>([]);
  const setCrumbs = useCallback((newCrumbs: Crumb[]) => {
    setCrumbsState(newCrumbs);
  }, []);
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error("useBreadcrumbContext must be used within BreadcrumbProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Breadcrumbs — registers crumbs into context (renders nothing)       */
/* ------------------------------------------------------------------ */

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const ctx = useContext(BreadcrumbContext);

  useEffect(() => {
    if (ctx) {
      ctx.setCrumbs(items);
      return () => ctx.setCrumbs([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  // Renders null — AppShell renders them via BreadcrumbBar in AppLayout's breadcrumbs slot
  return null;
}

/* ------------------------------------------------------------------ */
/* BreadcrumbBar — Cloudscape BreadcrumbGroup for AppLayout slot       */
/* ------------------------------------------------------------------ */

export function BreadcrumbBar() {
  const ctx = useContext(BreadcrumbContext);
  const crumbs = ctx?.crumbs ?? [];

  if (crumbs.length === 0) return null;

  return (
    <BreadcrumbGroup
      items={crumbs.map((c) => ({ text: c.label, href: c.href ?? "#" }))}
      ariaLabel="Breadcrumbs"
      onFollow={(e) => {
        e.preventDefault();
        if (e.detail.href && e.detail.href !== "#") {
          window.location.href = e.detail.href;
        }
      }}
    />
  );
}

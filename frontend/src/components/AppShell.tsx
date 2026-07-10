"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@cloudscape-design/components/app-layout";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Flashbar } from "./Flashbar";
import { LoadingBlock } from "./Primitives";
import { SideNav } from "./SideNav";
import { TopHeader } from "./TopHeader";
import { BreadcrumbBar, BreadcrumbProvider } from "./Breadcrumbs";
import { SplitPanelProvider, useSplitPanel } from "@/lib/split-panel-context";
import SplitPanel from "@cloudscape-design/components/split-panel";

/**
 * Wraps all authenticated pages with the full Cloudscape AppLayout chrome:
 * TopNavigation, SideNavigation, BreadcrumbGroup, Flashbar, and content area.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { notifications, dismiss } = useNotifications();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(true);

  return (
    <SplitPanelProvider>
      <AppShellInner>{children}</AppShellInner>
    </SplitPanelProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { notifications, dismiss } = useNotifications();
  const { splitPanelOpen, setSplitPanelOpen, splitPanelContent, splitPanelHeader } = useSplitPanel();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <LoadingBlock label="Loading console" />
      </div>
    );
  }

  return (
    <BreadcrumbProvider>
      <TopHeader />
      <AppLayout
        headerSelector="#top-header"
        navigation={<SideNav />}
        navigationOpen={navOpen}
        onNavigationChange={({ detail }) => setNavOpen(detail.open)}
        breadcrumbs={<BreadcrumbBar />}
        notifications={
          notifications.length > 0 ? (
            <Flashbar items={notifications} onDismiss={dismiss} />
          ) : undefined
        }
        content={children}
        toolsHide
        contentType="default"
        ariaLabels={{
          navigation: "Route 53 navigation",
          navigationClose: "Close navigation",
          navigationToggle: "Open navigation",
          notifications: "Notifications",
          tools: "Tools",
          toolsClose: "Close tools",
          toolsToggle: "Open tools",
        }}
        splitPanelPreferences={{ position: "side" }}
        splitPanelOpen={splitPanelOpen}
        onSplitPanelToggle={({ detail }) => setSplitPanelOpen(detail.open)}
        splitPanel={
          splitPanelContent ? (
            <SplitPanel
              header={splitPanelHeader || "Details"}
              hidePreferencesButton
            >
              {splitPanelContent}
            </SplitPanel>
          ) : undefined
        }
      />
    </BreadcrumbProvider>
  );
}

"use client";

import { useRouter } from "next/navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export function TopHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Build stacked display: "suryanshAWS (664473565875)" on top line, "suryanshAWS" as description
  const userName = user?.name ?? "suryanshAWS";
  const accountId = user?.account_id ?? "664473565875";
  const profileText = `${userName} (${accountId})`;

  return (
    <div id="top-header">
      <TopNavigation
        identity={{
          href: "/hosted-zones",
          title: "",
          logo: {
            // 45x22 viewBox, 24px font — tighter bounding box makes it render larger in TopNavigation
            src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSAyMiI+PHRleHQgeT0iMTgiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtZmFtaWx5PSJBbWF6b24gRW1iZXIsSGVsdmV0aWNhLHNhbnMtc2VyaWYiPmF3czwvdGV4dD48L3N2Zz4=",
            alt: "AWS",
          },
        }}
        utilities={[
          {
            type: "button",
            iconSvg: (
              <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm-1 12H3V3h10v10zM5 8h1V5h1V4H5zm2.5 4h1v-1h-1zm0-2h1V6h-1z"
                />
              </svg>
            ),
            title: "CloudShell",
            ariaLabel: "CloudShell",
          },
          {
            type: "button",
            iconName: "notification",
            title: "Notifications",
            ariaLabel: "Notifications",
            badge: false,
          },
          {
            type: "button",
            iconName: "status-info",
            title: "Help",
            ariaLabel: "Help",
          },
          {
            type: "menu-dropdown",
            iconName: "settings",
            title: "Settings",
            ariaLabel: "Settings",
            onItemClick: ({ detail }) => {
              if (detail.id === "toggle-theme") toggleTheme();
            },
            items: [
              {
                id: "toggle-theme",
                text: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
              },
            ],
          },
          {
            type: "button",
            text: "Global",
            title: "Route 53 is a global service — not region-specific",
            disableUtilityCollapse: false,
          },
          {
            type: "menu-dropdown",
            text: profileText,
            description: userName,
            iconName: "user-profile",
            onItemClick: ({ detail }) => {
              if (detail.id === "signout") handleLogout();
            },
            items: [
              {
                id: "account-info",
                text: `Account ID: ${accountId}`,
                disabled: true,
              },
              { id: "divider", text: "", disabled: true },
              { id: "settings", text: "Account settings" },
              { id: "signout", text: "Sign out" },
            ],
          },
        ]}
        i18nStrings={{
          searchIconAriaLabel: "Search",
          searchDismissIconAriaLabel: "Close search",
          overflowMenuTriggerText: "More",
          overflowMenuTitleText: "All",
          overflowMenuBackIconAriaLabel: "Back",
          overflowMenuDismissIconAriaLabel: "Close menu",
        }}
        search={
          <input
            type="search"
            placeholder="&#x2315;  [Alt+S]  Ask Amazon Q"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 4,
              color: "#fff",
              padding: "4px 12px",
              fontSize: 13,
              width: "100%",
              minWidth: 240,
              outline: "none",
            }}
            aria-label="Search [Alt+S] Ask Amazon Q"
          />
        }
      />
    </div>
  );
}

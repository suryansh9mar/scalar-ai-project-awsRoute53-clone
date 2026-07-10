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

  return (
    <div id="top-header">
      <TopNavigation
        identity={{
          href: "/hosted-zones",
          title: "Route 53",
          logo: {
            src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCAyNiI+PHRleHQgeT0iMjMiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtZmFtaWx5PSJBbWF6b24gRW1iZXIsIEhlbHZldGljYSxzYW5zLXNlcmlmIj5hd3M8L3RleHQ+PC9zdmc+",
            alt: "AWS",
          },
        }}
        utilities={[
          {
            type: "button",
            text: user?.account_id ?? "123456789012",
            title: "Account ID",
            disableUtilityCollapse: false,
          },
          {
            type: "button",
            text: "Global",
            title: "Route 53 is a global service — not region-specific",
            disableUtilityCollapse: false,
          },
          {
            type: "button",
            iconName: theme === "dark" ? "status-positive" : "status-stopped",
            title: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
            ariaLabel: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
            onClick: toggleTheme,
          },
          {
            type: "menu-dropdown",
            text: user?.name ?? "User",
            description: user?.email,
            iconName: "user-profile",
            onItemClick: ({ detail }) => {
              if (detail.id === "signout") handleLogout();
            },
            items: [
              {
                id: "account-info",
                text: `Account ID: ${user?.account_id ?? ""}`,
                disabled: true,
              },
              { id: "divider", text: "", disabled: true },
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
      />
    </div>
  );
}

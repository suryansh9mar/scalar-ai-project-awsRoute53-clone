"use client";

import { usePathname } from "next/navigation";
import SideNavigation, {
  type SideNavigationProps,
} from "@cloudscape-design/components/side-navigation";

const navItems: SideNavigationProps.Item[] = [
  { type: "link", text: "Dashboard", href: "/dashboard" },
  { type: "divider" },
  { type: "link", text: "Hosted zones", href: "/hosted-zones" },
  { type: "link", text: "Health checks", href: "/health-checks" },
  { type: "divider" },
  {
    type: "section",
    text: "Traffic flow",
    items: [{ type: "link", text: "Traffic policies", href: "/traffic-policies" }],
    defaultExpanded: true,
  },
  {
    type: "section",
    text: "Resolver",
    items: [{ type: "link", text: "Resolver", href: "/resolver" }],
    defaultExpanded: true,
  },
  { type: "divider" },
  { type: "link", text: "Profiles", href: "/profiles" },
];

export function SideNav() {
  const pathname = usePathname();

  // Determine active href: find the most specific link that matches the current path
  const activeHref =
    navItems
      .flatMap((item) => {
        if (item.type === "link") return [item.href];
        if (item.type === "section")
          return item.items
            .filter((i): i is SideNavigationProps.Link => i.type === "link")
            .map((i) => i.href);
        return [];
      })
      .filter((href) => pathname === href || pathname.startsWith(href + "/"))
      .sort((a, b) => b.length - a.length)[0] ?? "/hosted-zones";

  return (
    <SideNavigation
      header={{ text: "Route 53", href: "/hosted-zones" }}
      items={navItems}
      activeHref={activeHref}
      onFollow={(e) => {
        // Prevent default to use Next.js router — but since Cloudscape uses <a> tags
        // with standard href, Next.js Link interceptor handles it automatically
        // when using the AppLayout's navigation prop.
        e.preventDefault();
        window.location.href = e.detail.href;
      }}
    />
  );
}

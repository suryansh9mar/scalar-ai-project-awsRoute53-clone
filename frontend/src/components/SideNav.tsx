"use client";

import { usePathname } from "next/navigation";
import SideNavigation, {
  type SideNavigationProps,
} from "@cloudscape-design/components/side-navigation";
import Badge from "@cloudscape-design/components/badge";

const navItems: SideNavigationProps.Item[] = [
  { type: "link", text: "Dashboard", href: "/dashboard" },
  { type: "divider" },
  { type: "link", text: "Hosted zones", href: "/hosted-zones" },
  { type: "link", text: "Health checks", href: "/health-checks" },
  { type: "link", text: "Profiles", href: "/profiles" },
  { type: "divider" },
  {
    type: "section",
    text: "Global Resolver",
    defaultExpanded: true,
    items: [
      {
        type: "link",
        text: "Global resolvers",
        href: "/resolver/global",
        info: <Badge color="blue">New</Badge>,
      },
      {
        type: "link",
        text: "Shared DNS views",
        href: "/resolver/shared-views",
        info: <Badge color="blue">New</Badge>,
      },
    ],
  },
  {
    type: "section",
    text: "VPC Resolver",
    defaultExpanded: true,
    items: [
      { type: "link", text: "VPCs", href: "/resolver/vpcs" },
      { type: "link", text: "Inbound endpoints", href: "/resolver/inbound" },
      { type: "link", text: "Outbound endpoints", href: "/resolver/outbound" },
      { type: "link", text: "Rules", href: "/resolver/rules" },
      { type: "link", text: "Query logging", href: "/resolver/query-logging" },
      { type: "link", text: "Outposts", href: "/resolver/outposts" },
    ],
  },
  {
    type: "section",
    text: "Domains",
    defaultExpanded: true,
    items: [
      { type: "link", text: "Registered domains", href: "/domains" },
      { type: "link", text: "Requests", href: "/domains/requests" },
    ],
  },
  {
    type: "section",
    text: "IP-based routing",
    defaultExpanded: true,
    items: [
      { type: "link", text: "CIDR collections", href: "/ip-routing/cidr" },
    ],
  },
  {
    type: "section",
    text: "Traffic flow",
    defaultExpanded: true,
    items: [
      { type: "link", text: "Traffic policies", href: "/traffic-policies" },
      { type: "link", text: "Policy records", href: "/traffic-policies/records" },
    ],
  },
];

/** Collect all hrefs from a nav item tree (recursive). */
function collectHrefs(items: ReadonlyArray<SideNavigationProps.Item>): string[] {
  return items.flatMap((item) => {
    if (item.type === "link") return [item.href];
    if (item.type === "section") return collectHrefs(item.items);
    return [];
  });
}

export function SideNav() {
  const pathname = usePathname();

  const activeHref =
    collectHrefs(navItems)
      .filter((href) => pathname === href || pathname.startsWith(href + "/"))
      .sort((a, b) => b.length - a.length)[0] ?? "/hosted-zones";

  return (
    <SideNavigation
      header={{ text: "Route 53", href: "/hosted-zones" }}
      items={navItems}
      activeHref={activeHref}
      onFollow={(e) => {
        e.preventDefault();
        window.location.href = e.detail.href;
      }}
    />
  );
}

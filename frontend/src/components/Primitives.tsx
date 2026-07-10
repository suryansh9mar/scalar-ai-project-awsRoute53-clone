"use client";

import type { ReactNode } from "react";
import CSpinner from "@cloudscape-design/components/spinner";
import CBadge from "@cloudscape-design/components/badge";
import CContainer from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import CButton from "@cloudscape-design/components/button";

/* ---------- Spinner ---------- */
export function Spinner({ large }: { large?: boolean }) {
  return <CSpinner size={large ? "large" : "normal"} />;
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <Box textAlign="center" padding="xxl">
      <SpaceBetween direction="horizontal" size="xs" alignItems="center">
        <CSpinner />
        <Box color="text-status-inactive">{label}…</Box>
      </SpaceBetween>
    </Box>
  );
}

/* ---------- Badge ---------- */
type BadgeColor = "blue" | "green" | "grey" | "default" | "red";

const badgeColorMap: Record<BadgeColor, "blue" | "green" | "grey" | "red"> = {
  blue: "blue",
  green: "green",
  grey: "grey",
  default: "grey",
  red: "red",
};

export function Badge({
  color = "default",
  children,
}: {
  color?: BadgeColor;
  children: ReactNode;
}) {
  return (
    <CBadge color={badgeColorMap[color]}>{children as string}</CBadge>
  );
}

/* ---------- Container ---------- */
export function Container({
  title,
  count,
  description,
  actions,
  flush,
  children,
}: {
  title?: ReactNode;
  count?: number;
  description?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}) {
  const headerContent =
    title || actions ? (
      <Header
        variant="h2"
        description={description}
        counter={count !== undefined ? `(${count})` : undefined}
        actions={actions}
      >
        {title}
      </Header>
    ) : undefined;

  return (
    <CContainer
      header={headerContent}
      disableContentPaddings={flush}
    >
      {children}
    </CContainer>
  );
}

/* ---------- EmptyState ---------- */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <Box textAlign="center" color="inherit">
      <Box variant="strong" textAlign="center" color="inherit" padding="s">
        {title}
      </Box>
      {message && (
        <Box variant="p" padding={{ bottom: "s" }} color="inherit">
          {message}
        </Box>
      )}
      {action && (
        <SpaceBetween direction="horizontal" size="xs" alignItems="center">
          {action}
        </SpaceBetween>
      )}
    </Box>
  );
}

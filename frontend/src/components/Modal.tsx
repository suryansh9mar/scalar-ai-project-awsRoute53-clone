"use client";

import type { ReactNode } from "react";
import CModal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

export function Modal({
  title,
  open,
  onClose,
  footer,
  wide,
  children,
}: {
  title: ReactNode;
  open: boolean;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <CModal
      visible={open}
      onDismiss={onClose}
      header={title}
      size={wide ? "large" : "medium"}
      footer={
        footer ? (
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              {footer}
            </SpaceBetween>
          </Box>
        ) : undefined
      }
    >
      {children}
    </CModal>
  );
}

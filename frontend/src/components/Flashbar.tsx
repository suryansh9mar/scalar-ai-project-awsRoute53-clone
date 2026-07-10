"use client";

import CFlashbar, {
  type FlashbarProps,
} from "@cloudscape-design/components/flashbar";
import type { Notification, NotificationType } from "@/lib/notifications";

const typeMap: Record<NotificationType, FlashbarProps.MessageDefinition["type"]> = {
  success: "success",
  error: "error",
  info: "info",
  warning: "warning",
};

export function Flashbar({
  items,
  onDismiss,
}: {
  items: Notification[];
  onDismiss: (id: number) => void;
}) {
  const flashItems: FlashbarProps.MessageDefinition[] = items.map((item) => ({
    type: typeMap[item.type],
    header: item.header,
    content: item.message,
    dismissible: true,
    onDismiss: () => onDismiss(item.id),
    id: String(item.id),
  }));

  return <CFlashbar items={flashItems} stackItems />;
}

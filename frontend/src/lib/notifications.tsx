"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: number;
  type: NotificationType;
  header?: string;
  message: string;
}

interface NotificationsContextValue {
  notifications: Notification[];
  notify: (
    type: NotificationType,
    message: string,
    header?: string
  ) => void;
  dismiss: (id: number) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotificationType, message: string, header?: string) => {
      const id = nextId.current++;
      setNotifications((prev) => [...prev, { id, type, message, header }]);
      // Auto-dismiss success/info after 5 s
      if (type === "success" || type === "info") {
        setTimeout(() => dismiss(id), 5000);
      }
    },
    [dismiss]
  );

  return (
    <NotificationsContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  return ctx;
}

/**
 * NotificationsBar is now a no-op — notifications are rendered in the
 * AppLayout `notifications` slot inside AppShell.tsx directly.
 */
export function NotificationsBar() {
  return null;
}

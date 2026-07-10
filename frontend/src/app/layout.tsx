import type { Metadata } from "next";
import "./globals.css";
import "./components.css";
import "@cloudscape-design/global-styles/index.css";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationsProvider } from "@/lib/notifications";
import { ThemeProvider } from "@/lib/theme-context";
import { SideNavProvider } from "@/lib/sidenav-context";

export const metadata: Metadata = {
  title: "Route 53 Management Console",
  description: "A mocked clone of the AWS Route 53 console.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SideNavProvider>
            <AuthProvider>
              <NotificationsProvider>{children}</NotificationsProvider>
            </AuthProvider>
          </SideNavProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

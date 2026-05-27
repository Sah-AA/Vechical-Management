import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "../components/AuthGate";
import { AppProviders } from "../components/ui";

export const metadata: Metadata = {
  title: "JCB Admin Panel",
  description: "JCB / Tractor Management Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AuthGate>{children}</AuthGate>
        </AppProviders>
      </body>
    </html>
  );
}

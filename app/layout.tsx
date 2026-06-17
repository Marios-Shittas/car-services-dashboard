import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Services MGH",
  description: "Automotive workshop management for Car Services MGH",
  icons: {
    icon: [{ url: "/mgh-sidebar-logo.svg", type: "image/svg+xml" }],
    shortcut: "/mgh-sidebar-logo.svg",
    apple: "/mgh-sidebar-logo.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

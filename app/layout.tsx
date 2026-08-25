import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noatum Ports Marketing Dashboard",
  description: "Marketing and communications performance dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

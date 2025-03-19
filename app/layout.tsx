import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParkPoint",
  description: "Your parking management solution",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}

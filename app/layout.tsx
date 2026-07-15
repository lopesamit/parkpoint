import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ParkPoint — Find street parking in seconds",
    template: "%s · ParkPoint",
  },
  description:
    "ParkPoint is a community-driven platform for finding and reporting available street parking in real time. Spots reported in the last hour, right when you need them.",
  keywords: ["parking", "street parking", "find parking", "parking spots"],
  openGraph: {
    title: "ParkPoint — Find street parking in seconds",
    description:
      "Community-reported street parking, fresh within the last hour.",
    type: "website",
    siteName: "ParkPoint",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

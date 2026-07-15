import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import DashboardShell from "../components/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();

  // Middleware already guards this route; this is a safety net.
  if (!session) {
    redirect("/login");
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <DashboardShell
      user={{ name: session.name, email: session.email }}
      apiKey={apiKey}
    />
  );
}

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { getPrivateContext } from "@/features/dashboard/context";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "MiBazarPE · Mi negocio", template: "%s | MiBazarPE" }, robots: { index: false, follow: false } };

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const context = await getPrivateContext();
  return <AppShell context={context}>{children}</AppShell>;
}

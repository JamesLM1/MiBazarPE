import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

// Persistent presentation only; authentication stays in the existing routes.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}

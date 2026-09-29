import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiBazarPE",
  description: "MiBazarPE",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}

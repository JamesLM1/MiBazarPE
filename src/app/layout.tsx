import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  title: "MiBazarPE",
  description: "MiBazarPE",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`dark ${geist.variable} ${geistMono.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}

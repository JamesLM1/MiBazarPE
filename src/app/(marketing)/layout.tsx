import { Header } from "@/components/marketing/header";
import { LandingBackground } from "@/components/marketing/landing-background";
import styles from "./layout.module.css";
import { LandingPreferences } from "@/components/marketing/landing-preferences";
import { LandingWater } from "@/components/marketing/landing-water";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <LandingPreferences><div className={styles.shell}>
    <LandingBackground />
    <LandingWater />
    <Header />
    {children}
  </div></LandingPreferences>;
}

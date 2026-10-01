import { Hero } from "@/components/marketing/hero";
import { LogoCloud } from "@/components/marketing/logo-cloud";
import { Team } from "@/components/marketing/team";

export default function Home() {
  return (
    <main id="inicio" className="scroll-mt-20">
      <Hero />
      <LogoCloud />
      <Team />
    </main>
  );
}

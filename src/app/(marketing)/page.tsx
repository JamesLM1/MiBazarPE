import { Hero } from "@/components/marketing/hero";
import { LogoCloud } from "@/components/marketing/logo-cloud";
import { Team } from "@/components/marketing/team";
import { Features } from "@/components/marketing/features";
import { FeaturesDashboard } from "@/components/marketing/features-dashboard";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";

export default function Home() {
  return (
    <main id="inicio" className="scroll-mt-20">
      <Hero />
      <LogoCloud />
      <Team />
      <Features />
      <FeaturesDashboard />
      <Pricing />
      <Testimonials />
    </main>
  );
}

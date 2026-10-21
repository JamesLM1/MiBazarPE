import { Hero } from "@/components/marketing/hero";
import { Team } from "@/components/marketing/team";
import { Features } from "@/components/marketing/features";
import { FeaturesDashboard } from "@/components/marketing/features-dashboard";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { Faqs } from "@/components/marketing/faqs";
import { Integrations } from "@/components/marketing/integrations";
import { Cta } from "@/components/marketing/cta";
import { Contact } from "@/components/marketing/contact";
import { Footer } from "@/components/marketing/footer";
import { BazarStory } from "@/components/marketing/bazar-story";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
    <main id="inicio" className={`${styles.landing} scroll-mt-20`}>
      <Hero />
      <BazarStory />
      <Team />
      <Features />
      <FeaturesDashboard />
      <Pricing />
      <Testimonials />
      <Faqs />
      <div id="tecnologias" className="scroll-mt-20">
        <Integrations />
      </div>
      <Cta contactHref="#contacto" />
      <Contact />
    </main>
    <Footer />
    </>
  );
}

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroDashboardPreview } from "@/components/marketing/hero-dashboard-preview";
import styles from "./hero.module.css";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className={styles.hero}>
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-14 px-5 py-16 sm:gap-16 sm:px-8 sm:py-24 lg:min-h-[740px] lg:grid-cols-[0.95fr_1.05fr] lg:gap-8 lg:px-4 lg:py-20">
        <div className="relative z-10 max-w-xl">
          <p className="mb-7 inline-flex max-w-full items-center gap-2.5 rounded-full border border-border/80 bg-card/80 px-3.5 py-2 text-xs font-medium text-foreground sm:text-sm">
            <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-ring" />
            Gestión inteligente para tu bazar
          </p>
          <h1 id="hero-title" className="text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.045em] text-balance">
            Controla tu bazar.
            <span className="mt-2 block text-muted-foreground">
              Vende, cobra y decide mejor.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            MiBazarPE centraliza ventas, inventario, créditos, pagos y caja para
            ayudarte a gestionar tu negocio desde un solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
            <Button asChild size="lg" className="h-11 gap-3 px-5">
              <Link href="/registro" prefetch={false}>
                Comenzar
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5">
              <Link href="/login" prefetch={false}>Iniciar sesión</Link>
            </Button>
          </div>
        </div>
        <HeroDashboardPreview />
      </div>
    </section>
  );
}

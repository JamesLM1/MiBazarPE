"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroDashboardPreview } from "./hero-dashboard-preview";
import styles from "./hero.module.css";

function useCompactViewport() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(max-width: 1023px)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(max-width: 1023px)").matches,
    () => false,
  );
}

export function Hero() {
  const track = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const compact = useCompactViewport();
  const [copyHidden, setCopyHidden] = useState(false);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setCopyHidden(progress >= 0.65);
  });
  // No spring or timed animation: each position belongs to a scroll position.
  const panelTransform = useTransform(scrollYProgress, (p) =>
    `translateY(${-p * 54}vh) perspective(1800px) rotateX(${compact ? 10 - p * 6 : 22 - p * 14}deg) rotateY(${compact ? -3 + p * 2 : -8 + p * 5}deg) rotateZ(${compact ? -3 + p * 2 : -8 + p * 3}deg) scale(${0.98 + p * 0.02})`
  );
  const panelOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0.65, 0.94, 1]);
  const copyTransform = useTransform(scrollYProgress, [0, 0.65, 1], ["translateY(0vh)", "translateY(-48vh)", "translateY(-65vh)"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.35, 0.65], [1, 1, 0]);
  const veilOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [0.65, 0.22, 0.08]);

  return (
    <section ref={track} aria-labelledby="hero-title" className={styles.heroTrack}>
      <div className={styles.heroSticky}>
        <div className={styles.container}>
          <motion.div className={styles.copy} inert={!reducedMotion && copyHidden} style={reducedMotion ? undefined : { transform: copyTransform, opacity: copyOpacity }}>
            <p className={styles.badge}>
              <Sparkles aria-hidden="true" className="size-3.5 shrink-0" />
              <span>Gestión inteligente para tu bazar</span>
              <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
            </p>
            <h1 id="hero-title" className={styles.title}>
              Controla tu bazar.<br />Vende, cobra y<br />decide mejor.
            </h1>
            <p className={styles.description}>
              MiBazarPE centraliza ventas, inventario, créditos, pagos y caja para ayudarte a gestionar tu negocio desde un solo lugar.
            </p>
            <div className={styles.actions}>
              <Button asChild className="h-9 gap-2 rounded-md px-4 text-sm font-medium">
                <Link href="/registro" prefetch={false}>Comenzar<ArrowRight aria-hidden="true" className="size-4" /></Link>
              </Button>
              <Button asChild variant="ghost" className="h-9 rounded-md px-4 text-sm font-medium">
                <Link href="/login" prefetch={false}>Iniciar sesión</Link>
              </Button>
            </div>
          </motion.div>
        </div>
        <div className={styles.previewStage}>
          <motion.div className={styles.panelMotion} style={reducedMotion ? undefined : { transform: panelTransform, opacity: panelOpacity }}>
            <HeroDashboardPreview />
            <motion.div aria-hidden="true" className={styles.veil} style={reducedMotion ? { opacity: 0 } : { opacity: veilOpacity }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

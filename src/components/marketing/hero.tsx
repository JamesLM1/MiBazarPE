"use client";
import { Localized } from "./localized";


import { ArrowDownRight, ArrowRight, Star, X } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { HeroDashboardPreview } from "./hero-dashboard-preview";
import { HeroLaptop } from "./hero-laptop";
import dashboardStyles from "./hero.module.css";
import styles from "./hero-showcase.module.css";

const EASE = [.23, 1, .32, 1] as const;
const PORTRAITS = ["01", "02", "03", "04", "05"];
function subscribePointer(notify: () => void) {
  const query = window.matchMedia("(hover: hover) and (pointer: fine)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

/** Adapted from SmoothUI header-3, MIT, Eduardo Calvo.
 * Same two-column showcase, staged entrance, hover lift and paired actions.
 * Existing scroll-driven dashboard retained below the showcase.
 * See SMOOTHUI-LICENSE.txt. The review strip is explicitly illustrative.
 */
export function Hero() {
  const track = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const compact = useSyncExternalStore((notify) => {
    const query = window.matchMedia("(max-width: 1023px)");
    query.addEventListener("change", notify);
    return () => query.removeEventListener("change", notify);
  }, () => window.matchMedia("(max-width: 1023px)").matches, () => false);
  const [copyHidden, setCopyHidden] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", progress => setCopyHidden(progress >= .65));
  const panelTransform = useTransform(scrollYProgress, p => `translateY(calc(${-p * 76}vh - ${p * 320}px)) perspective(1800px) rotateX(${32 - p * 27}deg) rotateY(${-12 + p * 11}deg) rotateZ(${-10 + p * 7}deg) scale(${.9 + p * .14})`);
  const panelOpacity = useTransform(scrollYProgress, [0, .6, 1], [.65, .94, 1]);
  const copyTransform = useTransform(scrollYProgress, [0, .65, 1], ["translateY(0vh) scale(1)", "translateY(-48vh) scale(.96)", "translateY(-65vh) scale(.94)"]);
  const copyOpacity = useTransform(scrollYProgress, [0, .35, .65], [1, 1, 0]);
  const veilOpacity = useTransform(scrollYProgress, [0, .7, 1], [.65, .22, .08]);
  const finePointer = useSyncExternalStore(subscribePointer,
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches, () => false);
  const item: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, transform: "translateY(12px)", filter: "blur(12px)" },
    visible: { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)", transition: { duration: reduce ? 0 : .35, ease: EASE } },
  };
  return <Localized><section ref={track} aria-labelledby="hero-title" className={styles.track} data-hero-scroll="">
    <div className={styles.sticky}>
    <motion.div className={styles.hero} inert={!reduce && !compact && copyHidden} data-hero-copy=""
      style={reduce || compact ? undefined : { transform: copyTransform, opacity: copyOpacity }}>
    <motion.div className={styles.container}
    initial={reduce ? false : { opacity: 0, transform: "scale(1.04)", filter: "blur(12px)" }}
    animate={{ opacity: 1, transform: "scale(1)", filter: "blur(0px)" }}
    transition={{ duration: reduce ? 0 : .35, ease: EASE }}>
      <motion.div className={styles.copy} initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: reduce ? 0 : .1 } } }}>
        <motion.h1 id="hero-title" className={styles.title} variants={item}>
          Controla<br />tu bazar.<br />Vende y cobra.<br />Decide mejor.
        </motion.h1>
        <motion.p className={styles.description} variants={item}>
          MiBazarPE centraliza ventas, inventario, créditos, pagos y caja para ayudarte a gestionar tu negocio desde un solo lugar.
        </motion.p>
        <motion.div className={styles.summary} variants={item}>
          <span className={styles.modules} aria-label="Retratos ficticios de escenarios de demostración">
            {PORTRAITS.map((number, index) => <motion.span key={number} className={styles.avatar}
              whileHover={!reduce && finePointer ? { transform: "translateY(-8px)" } : undefined}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Image src={`/testimonials/persona-${number}.webp`} alt={`Retrato ficticio de ejemplo ${index + 1}`} width={48} height={48} sizes="48px" />
            </motion.span>)}
          </span>
          <div className={styles.summaryCopy}>
            <p className={styles.rating} aria-label="Valoración ilustrativa: cinco de cinco">
              {[1, 2, 3, 4, 5].map(star => <Star key={star} size={18} aria-hidden="true" />)}<span>5.0</span>
            </p>
            <p className={styles.summaryNote}>Reseñas ilustrativas</p>
          </div>
        </motion.div>
        <motion.div className={styles.actions} variants={item}>
          <Button asChild className={styles.primary}>
            <Link href="/registro" prefetch={false}>Comenzar<ArrowRight size={16} aria-hidden="true" /></Link>
          </Button>
          <Dialog.Root open={demoOpen} onOpenChange={setDemoOpen}>
            <Dialog.Trigger asChild>
              <Button variant="outline" className={styles.secondary}>Ver demostración<ArrowDownRight size={16} aria-hidden="true" /></Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className={styles.demoOverlay} />
              <Dialog.Content className={styles.demoDialog}>
                <Dialog.Title className={styles.demoTitle}>MiBazarPE en acción</Dialog.Title>
                <Dialog.Description className={styles.demoDescription}>Un recorrido de 32 segundos con datos ficticios de demostración. Sin audio.</Dialog.Description>
                <video className={styles.demoVideo} controls autoPlay playsInline preload="metadata" poster="/demo/portada.jpg"
                  aria-label="Recorrido por MiBazarPE con datos de demostración">
                  <source src="/demo/mibazarpe-recorrido.mp4" type="video/mp4" />
                  Tu navegador no puede reproducir este video. <a href="/demo/mibazarpe-recorrido.mp4">Abrir demostración</a>.
                </video>
                <Dialog.Close asChild>
                  <button type="button" className={styles.demoClose} aria-label="Cerrar demostración"><X size={18} aria-hidden="true" /></button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </motion.div>
      </motion.div>
      <HeroLaptop active={(compact || !copyHidden) && !demoOpen} compact={compact} />
    </motion.div>
    </motion.div>
    <div className={`${dashboardStyles.previewStage} ${styles.dashboardStage}`}>
      <motion.div className={dashboardStyles.panelMotion} style={reduce || compact ? undefined : { transform: panelTransform, opacity: panelOpacity }}>
        <HeroDashboardPreview />
        <motion.div aria-hidden="true" className={dashboardStyles.veil} style={reduce || compact ? { opacity: 0 } : { opacity: veilOpacity }} />
      </motion.div>
    </div>
    </div>
  </section></Localized>;
}

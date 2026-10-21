"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { motion, useInView } from "motion/react";
import { Localized } from "./localized";
import { useLandingPreferences } from "./landing-preferences";
import styles from "./cta.module.css";

const shops = [
  { title: "Un bazar de barrio", image: "01-bazar" },
  { title: "Una papelería", image: "02-papeleria" },
  { title: "Una tienda de abarrotes", image: "03-abarrotes" },
  { title: "Una ferretería", image: "04-ferreteria" },
  { title: "Una tienda para el hogar", image: "05-hogar" },
  { title: "Una tienda de ropa", image: "06-tienda" },
  { title: "Un minimarket", image: "07-minimarket" },
] as const;

const imagePath = (index: number) => `/images/shops-carousel/${shops[index].image}.webp`;
const wrap = (index: number) => ((index % shops.length) + shops.length) % shops.length;
// The reference's power4.out: a quick reveal with a long, soft settle.
const revealEase = (progress: number) => 1 - Math.pow(1 - progress, 5);
const fullImage = "polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%)";
const closedImage = "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)";
const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(notify: () => void) {
  const preference = window.matchMedia(reducedQuery);
  preference.addEventListener("change", notify);
  return () => preference.removeEventListener("change", notify);
}
const reducedSnapshot = () => window.matchMedia(reducedQuery).matches;
const serverReducedSnapshot = () => false;

type Frame = { key: number; index: number; gentle: boolean };
type CtaProps = { contactHref?: string };

/** Modular split-image carousel. Input stays inside this section, never on document. */
export function Cta(_props: CtaProps) {
  // Keep the existing page's prop contract after removing the visible CTA links.
  void _props;
  const { t } = useLandingPreferences();
  const reduced = useSyncExternalStore(subscribeReducedMotion, reducedSnapshot, serverReducedSnapshot);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.1, once: true });
  const pointer = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressClick = useRef(false);
  const [gallery, setGallery] = useState({
    position: 0,
    gentle: false,
    frames: [{ key: 0, index: 0, gentle: true }] as Frame[],
    revision: 0,
  });
  const active = wrap(gallery.position);
  const gentle = !!reduced || gallery.gentle;

  useEffect(() => {
    if (!inView) return;
    // Compressed local files are shared by both halves. Warm the cache before the next click.
    shops.forEach((_, index) => {
      const image = new window.Image();
      image.src = imagePath(index);
      void image.decode().catch(() => {});
    });
  }, [inView]);

  function advance(direction: number, keyboard = false) {
    const quiet = !!reduced || keyboard;
    setGallery(previous => {
      const position = previous.position + direction;
      const revision = previous.revision + 1;
      return {
        position, revision, gentle: quiet,
        // Keep only a small bounded stack, even if the visitor clicks rapidly.
        frames: [...previous.frames.slice(-2), { key: revision, index: wrap(position), gentle: quiet }],
      };
    });
  }

  function startSwipe(event: PointerEvent<HTMLButtonElement>) {
    suppressClick.current = false;
    if (event.pointerType === "mouse") return;
    pointer.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishSwipe(event: PointerEvent<HTMLButtonElement>) {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId) return;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    if (Math.abs(horizontal) > 45 && Math.abs(horizontal) > Math.abs(vertical)) {
      suppressClick.current = true;
      advance(horizontal < 0 ? 1 : -1);
    }
  }

  return (
    <Localized>
      <section ref={sectionRef} id="comenzar" className={styles.section} aria-labelledby="cta-title">
        <div className={styles.gallery} data-reduced={!!reduced}>
          <header className={styles.header}>
            <h2 id="cta-title">Cada tienda, un mundo.</h2>
            <span className={styles.kicker}>PEQUEÑOS NEGOCIOS · GRANDES POSIBILIDADES</span>
          </header>

          <div className={styles.carousel} role="region" aria-roledescription={t("carrusel")}
            aria-label="Comercios que inspiran MiBazarPE" data-active-slide={active + 1}
            onKeyDown={event => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              advance(event.key === "ArrowRight" ? 1 : -1, true);
            }}>
            <button type="button" className={styles.surface} aria-label="Ver siguiente tipo de tienda"
              aria-describedby="shop-carousel-hint" onPointerDown={startSwipe} onPointerUp={finishSwipe}
              onPointerCancel={() => { pointer.current = null; suppressClick.current = true; }}
              onClick={event => {
                if (suppressClick.current) { suppressClick.current = false; return; }
                advance(1, event.detail === 0);
              }}>
              <span className={styles.imageStage} aria-hidden="true">
                {["top", "bottom"].map((half, halfIndex) => (
                  <span key={half} className={half === "top" ? styles.topHalf : styles.bottomHalf}>
                    {gallery.frames.map(frame => (
                      <motion.span key={frame.key} className={styles.imageLayer}
                        initial={frame.key === 0 ? false : {
                          clipPath: frame.gentle ? fullImage : closedImage,
                          transform: frame.gentle ? "scale(1)" : "scale(2)",
                          opacity: frame.gentle ? 0 : 1,
                        }}
                        animate={{ clipPath: fullImage, transform: "scale(1)", opacity: 1 }}
                        transition={{ duration: frame.gentle || reduced ? 0.16 : 2,
                          delay: frame.gentle || reduced ? 0 : halfIndex * 0.15, ease: revealEase }}>
                        <Image src={imagePath(frame.index)} alt="" fill unoptimized
                          sizes="(max-width: 600px) 80vw, 500px" loading={inView ? "eager" : "lazy"}
                          draggable={false} />
                      </motion.span>
                    ))}
                  </span>
                ))}
              </span>
            </button>

            <div className={styles.titles} aria-hidden="true">
              {[-2, -1, 0, 1, 2].map(offset => {
                const position = gallery.position + offset;
                return (
                  <motion.div key={position} className={styles.title} data-active={offset === 0}
                    initial={false}
                    animate={{ transform: `translate3d(${offset * 100}%, 0, 0)` }}
                    transition={{ duration: gentle ? 0 : 2, ease: revealEase }}>
                    <span className={styles.titleText}>{shops[wrap(position)].title}</span>
                  </motion.div>
                );
              })}
            </div>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {t(shops[active].title)}. {active + 1} / {shops.length}
            </p>
          </div>

          <footer className={styles.footer}>
            <p id="shop-carousel-hint" className={styles.hint}>Haz clic en la imagen o desliza para explorar</p>
          </footer>
        </div>
      </section>
    </Localized>
  );
}

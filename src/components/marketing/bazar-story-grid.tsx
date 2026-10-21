"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import { useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { storyChapters, storyImages } from "./bazar-story-data";
import { gridFrame, sceneParameters, tileFrame } from "./bazar-story-motion";
import styles from "./bazar-story.module.css";

const mediaQuery = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const subscribe = (callback: () => void) => {
  const query = window.matchMedia(mediaQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getSnapshot = () => window.matchMedia(mediaQuery).matches;
const getServerSnapshot = () => false;

export function BazarStoryGrid({ scene, children }: { scene: number; children: ReactNode }) {
  const chapter = storyChapters[scene];
  const root = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const paint = useRef<(progress: number) => void>(() => {});
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start 105%", "end -5%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 26, mass: .7 });

  useEffect(() => {
    const section = root.current;
    const gridWrap = wrap.current;
    if (!section || !gridWrap) return;
    const items = [...gridWrap.querySelectorAll<HTMLElement>("[data-story-tile]")];
    const images = items.map(item => item.querySelector<HTMLElement>("[data-story-image]")!);
    const params = sceneParameters(scene, items.length);

    const render = (value: number) => {
      if (!enabled || !active.current) return;
      gridWrap.style.transform = gridFrame(scene, value);
      section.dataset.progress = value.toFixed(4);
      items.forEach((item, index) => {
        const frame = tileFrame(scene, index, items.length, params[index], value);
        item.style.transform = frame.transform;
        images[index].style.transform = frame.imageTransform;
        images[index].style.opacity = String(frame.opacity);
      });
    };
    paint.current = render;
    const observer = new IntersectionObserver(([entry]) => {
      active.current = entry.isIntersecting;
      render(progress.get());
    }, { rootMargin: "100% 0px" });
    observer.observe(section);
    return () => {
      observer.disconnect();
      paint.current = () => {};
      gridWrap.style.removeProperty("transform");
      items.forEach((item, index) => {
        item.style.removeProperty("transform");
        images[index].style.removeProperty("transform");
        images[index].style.removeProperty("opacity");
      });
    };
  }, [enabled, progress, scene]);

  useMotionValueEvent(progress, "change", value => paint.current(value));

  return (
    <section ref={root} className={`${styles.chapter} ${styles[`chapter${scene + 1}`]}`} aria-labelledby={`bazar-story-chapter-${scene + 1}`} data-story-scene={scene + 1} data-animated={enabled}>
      <div className={styles.grid} aria-hidden="true">
        <div ref={wrap} className={styles.gridWrap}>
          {chapter.images.map((imageIndex, index) => {
            const image = storyImages[imageIndex];
            return (
              <div key={index} className={styles.tile} data-story-tile="">
                <div className={styles.image} data-story-image="">
                  <Image src={`/images/bazar-story-v2/${image.file}`} alt="" fill unoptimized sizes="(max-width: 767px) 50vw, 40vw" loading="lazy" className={styles.photo} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {children}
    </section>
  );
}

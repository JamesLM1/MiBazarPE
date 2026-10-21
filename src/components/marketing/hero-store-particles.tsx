"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./hero-showcase.module.css";

type Seed = { x: number; y: number; phase: number; speed: number; bright: number; color: string };
const SHOP_IMAGE = "/brand/hero/bazar-particles-natural.webp";

/** Real moving points sampled from the shop's luminous silhouette. */
export function HeroStoreParticles({ active = true }: { active?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    const context = surface?.getContext("2d");
    if (!surface || !context) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let frame = 0;
    let last = 0;
    let seconds = 0;
    let visible = true;
    let seeds: Seed[] = [];
    const random = (index: number) => {
      const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    const draw = () => {
      context.clearRect(0, 0, 448, 624);
      context.globalCompositeOperation = "lighter";
      context.lineWidth = .55;
      for (let index = 0; index < seeds.length; index++) {
        const seed = seeds[index];
        // Each point retains the actual local color of its material/product.
        context.fillStyle = seed.color;
        context.strokeStyle = seed.color;
        const life = (seed.phase + seconds * seed.speed) % 1;
        const wave = Math.sin(life * Math.PI);
        const drift = index % 4 === 0 ? 72 : 16;
        const x = seed.x + Math.sin(seconds * 1.4 + seed.phase * 6.28) * 3 + life * drift;
        const y = seed.y + life * drift * .7;
        context.globalAlpha = wave * (.18 + seed.bright * .5);
        const size = index % 7 === 0 ? 1.35 : .75;
        context.fillRect(x, y, size, size);
        if (index % 12 === 0) {
          context.globalAlpha *= .55;
          context.beginPath();
          context.moveTo(x, y);
          context.quadraticCurveTo(x + 5, y + 7, x + 10 + wave * 12, y + 18);
          context.stroke();
        }
      }
      context.globalAlpha = 1;
    };
    const tick = (now: number) => {
      if (now - last >= 1000 / 30) {
        seconds += Math.min(now - last, 80) / 1000;
        last = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      if (!active || reduce.matches || document.hidden || !visible) {
        context.clearRect(0, 0, 448, 624);
      } else if (seeds.length) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const image = new window.Image();
    image.onload = () => {
      if (disposed) return;
      const sample = document.createElement("canvas");
      sample.width = 160;
      sample.height = 200;
      const sampleContext = sample.getContext("2d", { willReadFrequently: true });
      if (!sampleContext) return;
      sampleContext.drawImage(image, 0, 0, 160, 200);
      const pixels = sampleContext.getImageData(0, 0, 160, 200).data;
      const candidates: { x: number; y: number; bright: number; color: string }[] = [];
      for (let y = 0; y < 200; y++) {
        for (let x = 0; x < 160; x++) {
          const index = (y * 160 + x) * 4;
          const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
          const bright = Math.max(red, green, blue) / 255;
          if (bright > .33 && pixels[index + 3] > 45) {
            candidates.push({ x: x * 2.8, y: 32 + y * 2.8, bright, color: `rgb(${red} ${green} ${blue})` });
          }
        }
      }
      if (!candidates.length) return;
      seeds = Array.from({ length: 2000 }, (_, index) => ({
        ...candidates[Math.floor(random(index + 5) * candidates.length)],
        phase: random(index + 103), speed: .18 + random(index + 41) * .18,
      }));
      surface.dataset.ready = "true";
      sync();
    };
    image.src = SHOP_IMAGE;
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    intersection.observe(surface);
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduce.removeEventListener("change", sync);
      image.onload = null;
    };
  }, [active]);

  return <figure className={styles.art} data-active={active}>
    <Image src={SHOP_IMAGE} alt="Un bazar de partículas multicolor: toldo rojo y crema, madera cálida y productos de colores naturales"
      width={1122} height={1402} sizes="(min-width: 1024px) 448px, (min-width: 640px) 520px, calc(100vw - 48px)"
      className={styles.artImage} priority />
    <canvas ref={canvas} width={448} height={624} className={styles.artParticles} aria-hidden="true" />
  </figure>;
}

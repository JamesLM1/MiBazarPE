"use client";

import { animate } from "motion/mini";
import { useEffect, useRef } from "react";
import styles from "./landing-background.module.css";

const CELL = 56;
const TRAIL = Array.from({ length: 48 }, (_, index) => index);
const AMBIENT = Array.from({ length: 18 }, (_, index) => index);

/** SmoothUI header-4 geometry, MIT, Eduardo Calvo. See SMOOTHUI-LICENSE.txt.
 * A projected CSS grid and small tile pool replace thousands of DOM cells.
 */
export function LandingBackground() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    const plane = grid.current;
    if (!container || !plane) return;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tiles = Array.from(plane.querySelectorAll<HTMLElement>("[data-trail]"));
    const ambient = Array.from(plane.querySelectorAll<HTMLElement>("[data-ambient]"));
    let animations: ReturnType<typeof animate>[] = [];
    let frame = 0;
    let cursor = 0;
    let active: HTMLElement | undefined;
    let lastCell = "";
    let position: { x: number; y: number } | undefined;
    let geometry: { x: number; y: number; width: number; height: number; size: number; perspective: number; matrix: DOMMatrixReadOnly };

    const clear = () => {
      active?.removeAttribute("data-lit");
      active = undefined;
      lastCell = "";
    };
    const project = (sx: number, sy: number) => {
      const { perspective: p, matrix: m } = geometry;
      const a = m.m11 + sx * m.m13 / p;
      const b = m.m21 + sx * m.m23 / p;
      const c = m.m12 + sy * m.m13 / p;
      const d = m.m22 + sy * m.m23 / p;
      const determinant = a * d - b * c;
      if (Math.abs(determinant) < 0.000001) return undefined;
      return { x: (sx * d - b * sy) / determinant, y: (a * sy - sx * c) / determinant };
    };
    const stopAmbient = () => {
      animations.forEach(animation => animation.cancel());
      animations = [];
      ambient.forEach(tile => { tile.style.opacity = "0"; });
    };
    const syncAmbient = () => {
      stopAmbient();
      if (reduce.matches || document.hidden) return;
      // Three small waves around the content, each with six neighbouring tiles.
      const anchors = [[-.38, -.32], [.38, -.06], [-.26, .37]];
      ambient.forEach((tile, index) => {
        const group = Math.floor(index / 6);
        const anchor = anchors[group];
        const point = project(anchor[0] * geometry.width, anchor[1] * geometry.height);
        if (!point) return;
        const x = (Math.floor((point.x + geometry.size / 2) / CELL) + index % 3) * CELL;
        const y = (Math.floor((point.y + geometry.size / 2) / CELL) + Math.floor(index % 6 / 3)) * CELL;
        tile.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        animations.push(animate(tile, { opacity: [0, .32, 0, 0] }, {
          duration: 12, times: [0, .18, .46, 1],
          delay: group * 3 + index % 6 * .18,
          repeat: Infinity, ease: "easeInOut",
        }));
      });
    };
    const measure = () => {
      const rect = container.getBoundingClientRect();
      geometry = {
        x: rect.left, y: rect.top, width: rect.width, height: rect.height,
        size: 0, perspective: Number.parseFloat(getComputedStyle(container).perspective),
        matrix: new DOMMatrixReadOnly(getComputedStyle(plane).transform),
      };
      // Inverse-project all viewport corners, then add two cells of overscan.
      // Increasing the plane does not increase tile size or leave a bare corner.
      let half = CELL * 20;
      for (const x of [-rect.width / 2, rect.width / 2]) {
        for (const y of [-rect.height / 2, rect.height / 2]) {
          const point = project(x, y);
          if (point) half = Math.max(half, Math.abs(point.x), Math.abs(point.y));
        }
      }
      geometry.size = Math.ceil((half + CELL * 2) / CELL) * CELL * 2;
      plane.style.width = `${geometry.size}px`;
      clear();
      tiles.forEach(tile => tile.removeAttribute("data-lit"));
      syncAmbient();
    };
    const paint = () => {
      frame = 0;
      if (!position || !pointer.matches || reduce.matches || document.hidden) { clear(); return; }
      const point = project(position.x - geometry.x - geometry.width / 2, position.y - geometry.y - geometry.height / 2);
      if (!point) { clear(); return; }
      const col = Math.floor((point.x + geometry.size / 2) / CELL);
      const row = Math.floor((point.y + geometry.size / 2) / CELL);
      const key = `${col},${row}`;
      if (key === lastCell) return;
      clear();
      lastCell = key;
      active = tiles[cursor++ % tiles.length];
      active.style.transform = `translate3d(${col * CELL}px, ${row * CELL}px, 0)`;
      active.setAttribute("data-lit", "");
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !pointer.matches || reduce.matches) return;
      position = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const reset = () => { position = undefined; clear(); };
    const visibility = () => { reset(); syncAmbient(); };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(container);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", reset, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", visibility);
    reduce.addEventListener("change", measure);
    pointer.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      clear();
      stopAmbient();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", reset);
      window.removeEventListener("scroll", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", visibility);
      reduce.removeEventListener("change", measure);
      pointer.removeEventListener("change", reset);
    };
  }, []);

  return <>
    <div ref={root} className={styles.background} aria-hidden="true" data-landing-background="smoothui-header-4">
      <div ref={grid} className={styles.grid}>
        {AMBIENT.map(index => <span key={`ambient-${index}`} className={styles.ambient} data-ambient="" />)}
        {TRAIL.map(index => <span key={index} className={styles.tile} data-trail="" />)}
      </div>
    </div>
  </>;
}

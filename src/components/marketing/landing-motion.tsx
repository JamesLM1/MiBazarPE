"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

export const landingEase = [0.23, 1, 0.32, 1] as const;
export const landingEntrance = {
  hidden: { opacity: 0, transform: "translateY(28px) scale(.985)" },
  visible: { opacity: 1, transform: "translateY(0px) scale(1)" },
};

/** Local pointer events update Motion values, never React state per frame. */
export function usePointerDepth() {
  const reduced = useReducedMotion();
  const bounds = useRef<DOMRect | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const active = useMotionValue(0);
  const lightX = useMotionValue(0);
  const lightY = useMotionValue(0);
  const spring = { stiffness: 180, damping: 26, mass: 0.7 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const presence = useSpring(active, spring);
  const transform = useTransform(() => `perspective(1100px) rotateX(${-sy.get() * 2}deg) rotateY(${sx.get() * 3}deg) translate3d(${sx.get() * 2}px,${-presence.get() * 4 + sy.get() * 2}px,0) scale(${1 + presence.get() * 0.003})`);
  const reflection = useTransform(() => `translate3d(${lightX.get() - 180}px,${lightY.get() - 180}px,0)`);
  const layer = useTransform(() => `translate3d(${sx.get() * 7}px,${sy.get() * 5}px,0)`);
  const reset = () => { x.set(0); y.set(0); active.set(0); bounds.current = null; };
  const enabled = () => !reduced && window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches;
  return {
    transform: reduced ? "none" : transform, reflection, layer, presence,
    handlers: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => { if (event.pointerType === "mouse" && enabled()) bounds.current = event.currentTarget.getBoundingClientRect(); },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "mouse" || !enabled()) { reset(); return; }
        const rect = bounds.current ?? event.currentTarget.getBoundingClientRect();
        bounds.current = rect;
        x.set(Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)));
        y.set(Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)));
        lightX.set(event.clientX - rect.left); lightY.set(event.clientY - rect.top); active.set(1);
      },
      onPointerLeave: reset,
      onPointerCancel: reset,
    },
  };
}

export function CountUp({ value, prefix = "", delay = 0, className }: { value: number; prefix?: string; delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.65 });
  const reduced = useReducedMotion();
  const count = useMotionValue(0);
  const formatted = useTransform(count, latest => `${prefix}${Math.round(latest).toLocaleString("en-US")}`);
  useEffect(() => {
    if (reduced) { count.set(value); return; }
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.5, delay, ease: landingEase });
    return () => controls.stop();
  }, [count, delay, inView, reduced, value]);
  return <motion.span ref={ref} className={className} data-count-target={value} aria-label={`${prefix}${value.toLocaleString("en-US")}`}>{formatted}</motion.span>;
}

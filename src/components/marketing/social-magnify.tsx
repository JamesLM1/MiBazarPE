"use client";
import { Localized } from "./localized";


import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";

type SocialItem = { href: string; label: string; icon: ReactNode };

function subscribePointer(notify: () => void) {
  const query = window.matchMedia("(hover: hover) and (pointer: fine)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function MagnifyLink({ item, mouseX, enabled }: { item: SocialItem; mouseX: MotionValue<number>; enabled: boolean }) {
  const link = useRef<HTMLAnchorElement>(null);
  const target = useTransform(mouseX, x => {
    const bounds = link.current?.getBoundingClientRect();
    if (!enabled || !bounds || !Number.isFinite(x)) return 1;
    const proximity = Math.max(0, 1 - Math.abs(x - bounds.left - bounds.width / 2) / 56);
    return 1 + proximity * proximity * .28;
  });
  // Match the existing landing pointer-depth spring.
  const scale = useSpring(target, { stiffness: 180, damping: 26, mass: .7 });
  const transform = useTransform(scale, value => `translate3d(0,${-(value - 1) * 10}px,0) scale(${value})`);
  return <Localized><motion.a ref={link} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}
    style={{ transform: enabled ? transform : "none" }}>{item.icon}</motion.a></Localized>;
}

/** Cursor distance drives only the small social marks; labels and layout stay still. */
export function SocialMagnify({ items, className }: { items: SocialItem[]; className: string }) {
  const mouseX = useMotionValue(Infinity);
  const reduced = useReducedMotion();
  const fine = useSyncExternalStore(subscribePointer,
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches, () => false);
  const enabled = fine && !reduced;
  return <Localized><div className={className}
    onPointerMove={event => { if (enabled && event.pointerType === "mouse") mouseX.set(event.clientX); }}
    onPointerLeave={() => mouseX.set(Infinity)}>
    {items.map(item => <MagnifyLink key={item.href} item={item} mouseX={mouseX} enabled={enabled} />)}
  </div></Localized>;
}

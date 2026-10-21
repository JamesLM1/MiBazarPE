"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { useWorkspaceMotion } from "./workspace-appearance";

export function AnimatedNumber({ value, currency, suffix = "" }: { value: number; currency?: string; suffix?: string }) {
  const element = useRef<HTMLSpanElement>(null);
  const visible = useInView(element, { once: true, amount: .2 });
  const reduceSystem = useReducedMotion();
  const reduceWorkspace = useWorkspaceMotion();
  const [shown, setShown] = useState(0);
  const current = useRef(0);
  const format = (n: number) => new Intl.NumberFormat("es-PE", currency ? { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }).format(n) + suffix;
  useEffect(() => {
    if (!visible || reduceSystem || reduceWorkspace || !Number.isFinite(value)) return;
    const from = current.current;
    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      // The reference uses a deliberate 1.2s count-up; begin only when visible.
      const progress = Math.min(1, (now - start) / 1200);
      const next = progress === 1 ? value : from + (value - from) * (1 - Math.pow(1 - progress, 3));
      current.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, visible, reduceSystem, reduceWorkspace]);
  return <span ref={element} aria-label={format(value)} data-animated-number><span aria-hidden="true">{format(reduceSystem || reduceWorkspace ? value : shown)}</span></span>;
}

export function AnimatedMetric({ text: value }: { text: string | number | null | undefined }) {
  const text = value === null || value === undefined ? "—" : String(value);
  const match = text.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return <>{text}</>;
  const amount = Number(match[2].replaceAll(",", ""));
  if (!Number.isFinite(amount)) return <>{text}</>;
  const currency = /S\//.test(match[1]) ? "PEN" : /US\$|USD/.test(match[1]) ? "USD" : undefined;
  if (!currency && (match[1] || match[3])) return <>{text}</>;
  return <AnimatedNumber value={amount} currency={currency} />;
}

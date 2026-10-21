"use client";

import { useEffect, useId, useRef } from "react";
import { startElectricField } from "./electric-wordmark-field";
import styles from "./electric-wordmark.module.css";

export function ElectricWordmark() {
  const id = useId().replaceAll(":", "");
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    return startElectricField(canvas, stage);
  }, []);

  return <div ref={stageRef} className={styles.wordmark} data-electric-wordmark>
    <svg viewBox="0 0 1200 230" className={styles.canvas} aria-hidden="true" focusable="false">
      <defs>
        <text id={`${id}-letters`} x="600" y="178" textAnchor="middle" className={styles.letters}>MiBazarPE</text>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".29" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".09" />
        </linearGradient>
      </defs>
      <use href={`#${id}-letters`} fill={`url(#${id}-base)`} />
    </svg>
    <canvas ref={canvasRef} width="1200" height="230" className={styles.field} aria-hidden="true" />
  </div>;
}

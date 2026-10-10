"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useSpring } from "motion/react";
import type { PointerEvent } from "react";
import type { AuthMascotState, AuthMode } from "@/features/auth/types";
import styles from "./auth.module.css";

export function AuthMascot({ mode, state }: { mode: AuthMode; state: AuthMascotState }) {
  const pitch = useSpring(0, { stiffness: 100, damping: 20 });
  const yaw = useSpring(0, { stiffness: 100, damping: 20 });
  const transform = useMotionTemplate`perspective(900px) rotateX(${pitch}deg) rotateY(${yaw}deg)`;
  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    pitch.set((.5 - (event.clientY - box.top) / box.height) * 5);
    yaw.set(((event.clientX - box.left) / box.width - .5) * 7);
  }
  return <div className={styles.mascot} data-mascot-state={state} onPointerMove={tilt}
    onPointerLeave={() => { pitch.set(0); yaw.set(0); }}>
    <motion.div className={styles.mascotFrame} style={{ transform }}>
      <div className={styles.mascotFloat}>
        <Image src="/brand/bazi/welcome.png" alt="Bazi te da la bienvenida a MiBazarPE" width={1254} height={1254}
          sizes="(min-width: 1024px) 36vw, 0px" priority className={styles.mascotPoster}
          data-active={mode !== "register" && state !== "success"} />
        <Image src="/brand/bazi/celebrate.png" alt="Bazi celebra tu siguiente paso" width={1254} height={1254}
          sizes="(min-width: 1024px) 36vw, 0px" className={styles.mascotPoster}
          data-active={mode === "register" || state === "success"} />
      </div>
    </motion.div>
  </div>;
}

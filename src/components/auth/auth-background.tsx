"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import styles from "./auth.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function getMotionSnapshot() { return !window.matchMedia(motionQuery).matches; }
function getServerSnapshot() { return false; }

// The shared Auth layout keeps this video mounted when changing routes.
export function AuthBackground() {
  const allowMotion = useSyncExternalStore(subscribeMotion, getMotionSnapshot, getServerSnapshot);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function syncPlayback() {
      if (!video) return;
      if (!allowMotion || document.hidden) video.pause();
      else void video.play().catch(() => { /* Keep the poster if autoplay is unavailable. */ });
    }
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => document.removeEventListener("visibilitychange", syncPlayback);
  }, [allowMotion]);

  return <div className={styles.background} aria-hidden="true">
      <video ref={videoRef} className={styles.backgroundVideo}
        src={allowMotion ? "/brand/bazi/mibazarpe-auth-loop.mp4" : undefined}
        poster="/brand/bazi/mibazarpe-auth-poster.jpg"
        autoPlay={allowMotion} muted loop playsInline preload="metadata"
        tabIndex={-1} disablePictureInPicture />
      <div className={styles.backgroundShade} />
    </div>;
}

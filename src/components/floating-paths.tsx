import styles from "@/components/auth/auth.module.css";

// Auth 5's curved-path motif, confined to the left panel.
export function FloatingPaths({ position }: { position: number }) {
  return <svg className={styles.paths} viewBox="0 0 700 900" fill="none" preserveAspectRatio="none" aria-hidden="true">
    <g className={position === 1 ? styles.pathDrift : styles.pathDriftReverse}>
      {Array.from({ length: 18 }, (_, index) => <path key={index}
        d={`M ${-120 + index * 9} ${340 + index * 12} C ${200 + index * 7} ${370 + index * 10}, ${360 + index * 8} ${620 + index * 7}, ${520 + index * 12} 960`}
        stroke="currentColor" strokeWidth={index % 4 === 0 ? 1.2 : 0.7}
        strokeOpacity={0.12 + (index % 6) * 0.045} vectorEffect="non-scaling-stroke" />)}
    </g>
  </svg>;
}

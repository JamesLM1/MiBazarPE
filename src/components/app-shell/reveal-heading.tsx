import { Children, isValidElement, type ReactNode, type ReactElement, type CSSProperties } from "react";
import styles from "./workspace-motion.module.css";

function headingText(children: ReactNode): string {
  return Children.toArray(children).map(child => typeof child === "string" || typeof child === "number" ? String(child) : isValidElement(child) ? headingText((child as ReactElement<{ children?: ReactNode }>).props.children) : "").join("");
}

/** Cadra-style character reveal; the full label stays accessible. */
export function RevealHeading({ children }: { children: ReactNode }) {
  const text = headingText(children);
  let position = 0;
  return <h1 aria-label={text} className={styles.heading} key={text}>{text.split(/(\s+)/).map((word, index) => /^\s+$/.test(word) ? word : <span className={styles.word} key={index} aria-hidden="true">{Array.from(word).map((letter, letterIndex) => <span className={styles.letter} key={letterIndex} style={{ "--letter-delay": `${position++ * 22}ms` } as CSSProperties}>{letter}</span>)}</span>)}</h1>;
}

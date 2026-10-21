"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useLandingPreferences } from "./landing-preferences";
import styles from "./story-reveal-title.module.css";

function Word({ word, index, total, progress }: { word:string;index:number;total:number;progress:ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const reduce=useReducedMotion();
  const start=index/total*.7;
  const opacity=useTransform(progress,[start,start+.25],[.24,1]);
  const transform=useTransform(progress,[start,start+.25],["translateX(14px)","translateX(0px)"]);
  return <motion.span className={styles.word} style={reduce ? undefined : {opacity,transform}}>{word}</motion.span>;
}
/** A reversible horizontal word reveal, added to the existing perspective scenes. */
export function StoryRevealTitle({ lines, id }: {lines:readonly string[];id:string}) {
  const {t}=useLandingPreferences();
  const ref=useRef<HTMLHeadingElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:["start 95%","end 35%"]});
  const translated=lines.map(t), words=translated.map(line=>line.split(/\s+/)),total=words.flat().length;
  let index=0;
  return <h3 ref={ref} id={id} tabIndex={-1} aria-label={translated.join(" ")} className={styles.title} data-story-reveal="">
    <span aria-hidden="true">{words.map((line,lineIndex)=><span key={lineIndex} className={styles.line}>{line.map((word,wordIndex)=><span key={wordIndex}><Word word={word} index={index++} total={total} progress={scrollYProgress}/>{wordIndex<line.length-1?" ":null}</span>)}{lineIndex<words.length-1?<br/>:null}</span>)}</span>
  </h3>;
}

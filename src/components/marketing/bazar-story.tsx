"use client";
import { Localized } from "./localized";
import { Cormorant_Garamond } from "next/font/google";
import { ArrowDown, ArrowRight } from "lucide-react";
import { BazarStoryGrid } from "./bazar-story-grid";
import { storyChapters } from "./bazar-story-data";
import styles from "./bazar-story.module.css";
import { StoryRevealTitle } from "./story-reveal-title";

const storySerif = Cormorant_Garamond({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-bazar-story" });

export function BazarStory() {
  return (
    <Localized><section id="historia-bazar" className={`${styles.story} ${storySerif.variable}`} aria-labelledby="bazar-story-title">
      <header className={styles.intro}>
        <h2 id="bazar-story-title" className={styles.introTitle}>
          <span className={styles.eyebrow}>Detrás del mostrador</span>
          <span className={styles.introHeading}>Pequeños negocios.<br />Grandes historias.</span>
        </h2>
        <p className={styles.introDescription}>Conoce el día a día que inspira MiBazarPE.</p>
        <a href="#bazar-story-chapter-1" className={styles.scrollHint}>Desplázate despacio<br />y recorre la historia.<ArrowDown size={19} aria-hidden="true" /></a>
      </header>

      {storyChapters.map((chapter, scene) => (
        <BazarStoryGrid key={chapter.number} scene={scene}>
          <div className={styles.chapterTitle}>
            <div className={styles.chapterCopy}>
              <p className={styles.chapterLabel}>{chapter.number} / 04 <span>{chapter.label}</span></p>
              <StoryRevealTitle id={`bazar-story-chapter-${scene + 1}`} lines={chapter.title} />
              <p className={styles.chapterDescription}>{chapter.description}</p>
            </div>
          </div>
        </BazarStoryGrid>
      ))}

      <div className={styles.outro}>
        <span className={styles.chapterLabel}>De la historia a la herramienta</span>
        <p className={styles.outroTitle}>Tu negocio merece<br />una visión más clara.</p>
        <a href="#funciones" className={styles.cta}>Conoce MiBazarPE <ArrowRight size={18} aria-hidden="true" /></a>
        <p className={styles.disclosure}>Imágenes referenciales creadas con IA; no representan clientes ni testimonios reales.</p>
      </div>
      <div id="despues-del-recorrido" className={styles.endMarker} tabIndex={-1} />
    </section></Localized>
  );
}

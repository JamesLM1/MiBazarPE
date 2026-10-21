"use client";
import { Localized } from "./localized";


import { useState } from "react";
import { Accordion } from "radix-ui";
import { AnimatePresence, LayoutGroup, motion, useIsPresent, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown, Grid2X2, Info, Layers, ShieldCheck } from "lucide-react";
import { landingEase, landingEntrance } from "./landing-motion";
import styles from "./faqs.module.css";

const categories = [
  { id: "all", label: "Todos los temas", icon: Grid2X2 },
  { id: "about", label: "Sobre MiBazarPE", icon: Info },
  { id: "features", label: "Funciones previstas", icon: Layers },
  { id: "development", label: "Desarrollo y datos", icon: ShieldCheck },
];

const questions = [
  { id: "what", category: "about", question: "¿Qué es MiBazarPE?", answer: "MiBazarPE es una aplicación web orientada a centralizar información relacionada con ventas, productos, inventario, clientes, créditos, pagos y caja de pequeños comercios." },
  { id: "demo", category: "development", question: "¿MiBazarPE ya utiliza datos reales?", answer: "La versión actual utiliza información demostrativa durante el desarrollo y validación de la plataforma. La integración con información real se realizará en etapas posteriores del proyecto." },
  { id: "sales", category: "features", question: "¿Puedo registrar ventas al contado y a crédito?", answer: "La propuesta contempla el registro de ventas y el seguimiento de operaciones a crédito, incluyendo cuotas, pagos y montos pendientes." },
  { id: "inventory", category: "features", question: "¿Puedo controlar mi inventario?", answer: "Sí. El alcance previsto incluye el registro de productos y el seguimiento de existencias para apoyar el control del inventario del bazar." },
  { id: "reports", category: "features", question: "¿MiBazarPE mostrará reportes del negocio?", answer: "Sí. El sistema contempla reportes que permitan consultar información sobre ventas, créditos, pagos, inventario y otros movimientos registrados." },
  { id: "browser", category: "about", question: "¿Necesito instalar un programa?", answer: "No. MiBazarPE está planteado como una aplicación web accesible desde un navegador compatible." },
  { id: "ai", category: "development", question: "¿La inteligencia artificial ya está disponible?", answer: "No en la versión actual. Las capacidades inteligentes forman parte de las siguientes etapas del proyecto y se incorporarán progresivamente conforme avance el desarrollo y sean validadas antes de su integración definitiva." },
  { id: "updates", category: "development", question: "¿MiBazarPE seguirá recibiendo actualizaciones?", answer: "Sí. MiBazarPE se encuentra actualmente en una etapa de prototipo y continuará evolucionando durante los próximos meses. Está previsto incorporar y refinar progresivamente funciones, experiencia de usuario, seguridad e integración de datos conforme avance el desarrollo y la validación del proyecto." },
  { id: "release", category: "development", question: "¿Cuándo estará disponible la versión final?", answer: "MiBazarPE continúa en desarrollo. Durante los próximos meses se irán completando las etapas previstas del proyecto antes de consolidar una versión final. La disponibilidad definitiva dependerá del avance de la implementación, las pruebas y la validación de sus funcionalidades." },
  { id: "production", category: "development", question: "¿Mis datos ya se almacenan en producción?", answer: "No. La integración definitiva con autenticación, base de datos y políticas de seguridad se realizará en las siguientes etapas de implementación." },
];

function AnswerPanel({ category, opened, onOpenChange, instant }: {
  category: string; opened: string; onOpenChange: (value: string) => void; instant: boolean;
}) {
  const present = useIsPresent();
  const active = categories.find(item => item.id === category)!;
  const filtered = questions.filter(item => category === "all" || item.category === category);
  const ActiveIcon = active.icon;
  return <Localized><motion.div className={styles.answerPanel} aria-hidden={!present} inert={!present}
    initial={instant ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: instant ? 0 : .18, ease: landingEase }}>
    <div className={styles.listHeading}><ActiveIcon size={16} aria-hidden="true" /><h3>{active.label}</h3><span>{filtered.length} preguntas</span></div>
    <div className={styles.frame}>
      <Accordion.Root type="single" collapsible value={opened} onValueChange={onOpenChange} className={styles.accordion}>
        {filtered.map(item => <Accordion.Item key={item.id} value={item.id} className={styles.item}>
          <Accordion.Header className={styles.questionHeading}>
            <Accordion.Trigger className={styles.trigger} id={`faq-trigger-${category}-${item.id}`} aria-controls={`faq-answer-${category}-${item.id}`}><span>{item.question}</span><ChevronDown className={styles.chevron} size={16} aria-hidden="true" /></Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={styles.content} id={`faq-answer-${category}-${item.id}`} aria-labelledby={`faq-trigger-${category}-${item.id}`}><div className={styles.response}><p>{item.answer}</p></div></Accordion.Content>
        </Accordion.Item>)}
      </Accordion.Root>
    </div>
  </motion.div></Localized>;
}

export function Faqs() {
  const [category, setCategory] = useState("all");
  const [opened, setOpened] = useState("");
  const [pointerChange, setPointerChange] = useState(true);
  const filtered = questions.filter(item => category === "all" || item.category === category);
  const reduced = useReducedMotion();
  const instant = Boolean(reduced || !pointerChange);

  const colReveal = (delay: number) => ({
    initial: reduced ? false : "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: 0.15 },
    variants: landingEntrance,
    transition: { duration: reduced ? 0 : 0.55, delay: reduced ? 0 : delay, ease: landingEase },
  });

  return (
    <Localized><section id="preguntas-frecuentes" className={styles.section} aria-labelledby="faqs-title">
      <div className={styles.layout}>
        {/* Left column — stagger eyebrow → title → description → cta → nav */}
        <motion.div
          className={styles.sidebar}
          initial={reduced ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.09 } } }}
          style={reduced ? undefined : { transform: "translateY(0px)" }}
        >
          <motion.header className={styles.intro} variants={landingEntrance} transition={{ duration: reduced ? 0 : 0.55, ease: landingEase }}>
            <p className={styles.eyebrow}>PREGUNTAS FRECUENTES</p>
            <h2 id="faqs-title">Tus preguntas,<br /><span>respondidas.</span></h2>
            <p>Conoce la propuesta, el alcance previsto y el estado actual de MiBazarPE.</p>
            <a href="#como-funciona" className={styles.cta}>Explorar la demo<ArrowUpRight size={13} aria-hidden="true" /></a>
          </motion.header>
          <motion.nav
            className={styles.categories}
            aria-label="Filtrar preguntas por tema"
            variants={landingEntrance}
            transition={{ duration: reduced ? 0 : 0.5, ease: landingEase }}
          >
            <LayoutGroup id="landing-faq-categories">
              {categories.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={category === id} aria-controls="faqs-list" onClick={event => { setPointerChange(event.detail > 0); setCategory(id); setOpened(""); }}>
                {category === id && (instant ? <span className={styles.categoryIndicator} aria-hidden="true" /> : <motion.span className={styles.categoryIndicator} layoutId="selected-category" aria-hidden="true" transition={{ duration: .25, ease: landingEase }} />)}
                <Icon size={15} aria-hidden="true" /><span>{label}</span><small>{id === "all" ? questions.length : questions.filter(item => item.category === id).length}</small>
              </button>)}
            </LayoutGroup>
          </motion.nav>
        </motion.div>

        {/* Right column — enters slightly after the left */}
        <motion.div className={styles.answers} {...colReveal(0.14)}>
          <span className="sr-only" aria-live="polite" aria-atomic="true">{filtered.length} preguntas disponibles</span>
          <div className={styles.panelStack} id="faqs-list">
            {instant ? <AnswerPanel category={category} opened={opened} onOpenChange={setOpened} instant /> : <AnimatePresence initial={false}>
              <AnswerPanel key={category} category={category} opened={opened} onOpenChange={setOpened} instant={false} />
            </AnimatePresence>}
          </div>
        </motion.div>
      </div>
    </section></Localized>
  );
}

"use client";

import { useState } from "react";
import { Accordion } from "radix-ui";
import { ArrowUpRight, ChevronDown, Grid2X2, Info, Layers, ShieldCheck } from "lucide-react";
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
  { id: "ai", category: "development", question: "¿La inteligencia artificial ya está disponible?", answer: "No. Las funciones inteligentes forman parte de etapas posteriores del proyecto y no deben presentarse actualmente como una funcionalidad operativa." },
  { id: "production", category: "development", question: "¿Mis datos ya se almacenan en producción?", answer: "No. La integración definitiva con autenticación, base de datos y políticas de seguridad se realizará en las siguientes etapas de implementación." },
];

export function Faqs() {
  const [category, setCategory] = useState("all");
  const [opened, setOpened] = useState("");
  const active = categories.find(item => item.id === category)!;
  const filtered = questions.filter(item => category === "all" || item.category === category);
  const ActiveIcon = active.icon;

  return (
    <section id="preguntas-frecuentes" className={styles.section} aria-labelledby="faqs-title">
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>PREGUNTAS FRECUENTES</p>
            <h2 id="faqs-title">Tus preguntas,<br /><span>respondidas.</span></h2>
            <p>Conoce la propuesta, el alcance previsto y el estado actual de MiBazarPE.</p>
            <a href="#como-funciona" className={styles.cta}>Explorar la demo<ArrowUpRight size={13} aria-hidden="true" /></a>
          </header>
          <nav className={styles.categories} aria-label="Filtrar preguntas por tema">
            {categories.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={category === id} aria-controls="faqs-list" onClick={() => { setCategory(id); setOpened(""); }}><Icon size={15} aria-hidden="true" /><span>{label}</span><small>{id === "all" ? questions.length : questions.filter(item => item.category === id).length}</small></button>)}
          </nav>
        </div>
        <div className={styles.answers}>
          <div className={styles.listHeading}><ActiveIcon size={16} aria-hidden="true" /><h3>{active.label}</h3><span aria-live="polite" aria-atomic="true">{filtered.length} preguntas</span></div>
          <div className={styles.frame} id="faqs-list">
            <Accordion.Root key={category} type="single" collapsible value={opened} onValueChange={setOpened} className={styles.accordion}>
              {filtered.map(item => <Accordion.Item key={item.id} value={item.id} className={styles.item}>
                <Accordion.Header className={styles.questionHeading}>
                  <Accordion.Trigger className={styles.trigger} id={`faq-trigger-${item.id}`} aria-controls={`faq-answer-${item.id}`}><span>{item.question}</span><ChevronDown className={styles.chevron} size={16} aria-hidden="true" /></Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className={styles.content} id={`faq-answer-${item.id}`} aria-labelledby={`faq-trigger-${item.id}`}><div className={styles.response}><p>{item.answer}</p></div></Accordion.Content>
              </Accordion.Item>)}
            </Accordion.Root>
          </div>
        </div>
      </div>
    </section>
  );
}

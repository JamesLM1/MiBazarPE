"use client";

import { useState, type FormEvent } from "react";
import { Mail, Phone } from "lucide-react";
import styles from "./contact.module.css";

// Simulated, configurable contact details for the academic prototype; not real business channels.
const demoContact = {
  email: "contacto@mibazarpe.pe",
  phone: "+51 1 700 0000",
  location: "San Isidro, Lima, Perú",
  mapQuery: "San Isidro, Lima, Peru",
} as const;

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim()
  || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
// Google Maps Embed API, place mode. No Maps JavaScript API or map dependencies.
const mapUrl = mapsKey
  ? `https://www.google.com/maps/embed/v1/place?${new URLSearchParams({ key: mapsKey, q: demoContact.mapQuery, language: "es", region: "PE" })}`
  : `https://www.google.com/maps?${new URLSearchParams({ q: demoContact.mapQuery, output: "embed" })}`;

export function Contact() {
  const [reviewed, setReviewed] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewed(true);
  }

  return (
    <section id="contacto" className={styles.section} aria-labelledby="contact-title">
      <div className={styles.frame}>
        <header className={styles.heading}>
          <h2 id="contact-title">NOS ENCANTARÍA<br />SABER DE TI</h2>
        </header>

        <div className={styles.directContacts} aria-label="Datos de contacto simulados del prototipo">
          <div className={styles.directContact}>
            <div><p className={styles.contactLabel}>ESCRÍBENOS</p><p className={styles.contactValue}>{demoContact.email}</p><small>Correo simulado del prototipo</small></div>
            <span className={styles.contactIcon} aria-hidden="true"><Mail size={22} strokeWidth={1.7} /></span>
          </div>
          <div className={styles.directContact}>
            <div><p className={styles.contactLabel}>LLÁMANOS</p><p className={styles.contactValue}>{demoContact.phone}</p><small>Teléfono simulado del prototipo</small></div>
            <span className={styles.contactIcon} aria-hidden="true"><Phone size={22} strokeWidth={1.7} /></span>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.mapPanel}>
            <h3>Dónde estamos</h3>
            <div className={styles.map}>
              <iframe title="Mapa de San Isidro, Lima, Perú — ubicación referencial del prototipo" src={mapUrl} width="100%" height="100%" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
            <p className={styles.location}>{demoContact.location}<span>Ubicación referencial del prototipo</span></p>
          </div>

          <div className={styles.formPanel}>
            <h3>¿Tienes una pregunta o una idea para MiBazarPE?<br />Nuestro equipo está aquí para ayudarte.</h3>
            <form className={styles.form} onSubmit={handleSubmit} onChange={() => setReviewed(false)} aria-label="Formulario de contacto" aria-describedby="contact-demo-note">
              <div className={styles.nameFields}>
                <div className={styles.field}><label htmlFor="contact-first-name">Nombres</label><input id="contact-first-name" autoComplete="given-name" placeholder="Nombres" required maxLength={100} /></div>
                <div className={styles.field}><label htmlFor="contact-last-name">Apellidos</label><input id="contact-last-name" autoComplete="family-name" placeholder="Apellidos" required maxLength={100} /></div>
              </div>
              <div className={styles.field}><label htmlFor="contact-email">Correo electrónico</label><input id="contact-email" type="email" autoComplete="email" placeholder="tu@correo.com" required maxLength={254} /></div>
              <div className={styles.field}><label htmlFor="contact-phone">Teléfono <span>(opcional)</span></label><input id="contact-phone" type="tel" autoComplete="tel" placeholder="Teléfono (opcional)" maxLength={30} /></div>
              <div className={styles.field}><label htmlFor="contact-subject">Asunto</label><input id="contact-subject" placeholder="Asunto" required maxLength={160} /></div>
              <div className={styles.field}><label htmlFor="contact-message">Mensaje</label><textarea id="contact-message" placeholder="Tu mensaje" rows={3} required maxLength={3000} /></div>
              <label className={styles.consent} htmlFor="contact-consent"><input id="contact-consent" type="checkbox" required /><span>Entiendo que este formulario es una demostración y que mis datos no se enviarán ni almacenarán.</span></label>
              <button type="submit" className={styles.submit}>Enviar mensaje</button>
              <p id="contact-demo-note" className={styles.note}>Prototipo académico. Envío de mensajes no disponible.</p>
              <p className={styles.feedback} role="status">{reviewed ? "Campos validados. No se ha enviado ningún mensaje ni guardado tus datos." : ""}</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

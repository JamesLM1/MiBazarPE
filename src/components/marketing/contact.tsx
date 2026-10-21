"use client";
import { Localized } from "./localized";


import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { MarketingCaptcha } from "./marketing-captcha";
import { marketingContact } from "@/lib/marketing-config";
import styles from "./contact.module.css";

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim()
  || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const mapQuery = "San Isidro, Lima, Peru";
const mapUrl = mapsKey
  ? `https://www.google.com/maps/embed/v1/place?${new URLSearchParams({ key: mapsKey, q: mapQuery, language: "es", region: "PE" })}`
  : `https://www.google.com/maps?${new URLSearchParams({ q: mapQuery, output: "embed" })}`;

export function Contact() {
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  // The widget already explains its own failures. Do not overwrite a send result.
  const captchaError = useCallback(() => { setToken(""); }, []);
  useEffect(() => {
    if (status && !pending) feedback.current?.focus();
  }, [status, pending]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!token) { setFailed(true); setStatus("Completa la verificación de seguridad antes de enviar."); return; }
    const form = event.currentTarget;
    const fields = new FormData(form);
    setPending(true); setFailed(false); setStatus("Enviando tu mensaje…");
    try {
      const response = await fetch("/api/contacto", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fields), consent: fields.get("consent") === "on", captchaToken: token }),
      });
      const result = await response.json();
      setFailed(!response.ok); setStatus(result.message || "No se pudo enviar. Inténtalo más tarde.");
      if (response.ok) { form.reset(); setDelivered(true); }
    } catch { setFailed(true); setStatus("No hay conexión. Conservamos el texto para que puedas volver a intentarlo."); }
    finally { setPending(false); setToken(""); setAttempt(value => value + 1); }
  }

  return <Localized><section id="contacto" className={styles.section} aria-labelledby="contact-title">
    <div className={styles.frame}>
      <header className={styles.heading}><h2 id="contact-title">NOS ENCANTARÍA<br />SABER DE TI</h2></header>
      <div className={styles.directContacts} aria-label="Canales de contacto de MiBazarPE">
        <div className={styles.directContact}>
          <div><p className={styles.contactLabel}>ESCRÍBENOS</p><a className={styles.contactValue} href={`mailto:${marketingContact.email}`}>{marketingContact.email}</a><small>Consultas y soporte de MiBazarPE</small></div>
          <a className={styles.contactIcon} href={`mailto:${marketingContact.email}`} aria-label="Escribir un correo a MiBazarPE"><Mail size={22} /></a>
        </div>
        <div className={styles.directContact}>
          <div><p className={styles.contactLabel}>LLÁMANOS O ESCRÍBENOS</p><a className={styles.contactValue} href={marketingContact.phoneHref}>{marketingContact.phone}</a><small><a href={marketingContact.whatsapp} target="_blank" rel="noopener noreferrer">Abrir conversación en WhatsApp ↗</a></small></div>
          <a className={styles.contactIcon} href={marketingContact.phoneHref} aria-label="Llamar a MiBazarPE"><Phone size={22} /></a>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.mapPanel}>
          <h3>Dónde estamos</h3>
          <div className={styles.map}>
            <iframe title="Mapa de San Isidro, Lima, Perú" src={mapUrl} width="100%" height="100%" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
          <p className={styles.location}>San Isidro, Lima, Perú</p>
          <a className={styles.whatsapp} href={marketingContact.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" />Conversar por WhatsApp ↗</a>
        </div>
        <div className={styles.formPanel}>
          <h3>¿Tienes una pregunta o una idea para MiBazarPE?<br />Nuestro equipo está aquí para ayudarte.</h3>
          <form className={styles.form} onSubmit={submit} aria-label="Formulario de contacto" aria-describedby="contact-note">
            <fieldset disabled={pending || delivered} className={styles.fields}>
              <div className={styles.nameFields}>
                <div className={styles.field}><label htmlFor="contact-first-name">Nombres</label><input id="contact-first-name" name="firstName" autoComplete="given-name" placeholder="Nombres" required minLength={2} maxLength={100} /></div>
                <div className={styles.field}><label htmlFor="contact-last-name">Apellidos</label><input id="contact-last-name" name="lastName" autoComplete="family-name" placeholder="Apellidos" required minLength={2} maxLength={100} /></div>
              </div>
              <div className={styles.field}><label htmlFor="contact-email">Correo electrónico</label><input id="contact-email" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required maxLength={254} /></div>
              <div className={styles.field}><label htmlFor="contact-phone">Teléfono <span>(opcional)</span></label><input id="contact-phone" name="phone" type="tel" autoComplete="tel" placeholder="Teléfono (opcional)" maxLength={30} /></div>
              <div className={styles.field}><label htmlFor="contact-subject">Asunto</label><input id="contact-subject" name="subject" placeholder="Asunto" required minLength={2} maxLength={160} /></div>
              <div className={styles.field}><label htmlFor="contact-message">Mensaje</label><textarea id="contact-message" name="message" placeholder="Cuéntanos cómo podemos ayudarte. No incluyas contraseñas ni datos financieros sensibles." rows={3} required minLength={2} maxLength={3000} /></div>
              <div className={styles.honeypot} aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              <label className={styles.consent}><input name="consent" type="checkbox" required /><span>Autorizo a {marketingContact.responsible}, responsable de MiBazarPE, a tratar estos datos para responder mi consulta, según la <Link href="/legal/privacidad">política de privacidad</Link>. Esto no me suscribe al boletín.</span></label>
            </fieldset>
            {!delivered && <MarketingCaptcha key={attempt} onToken={setToken} onError={captchaError} />}
            <div ref={feedback} tabIndex={-1} className={styles.feedback} data-error={failed || undefined} role={failed ? "alert" : "status"} aria-live="polite" aria-atomic="true">{status && <><strong>{pending ? "Enviando mensaje" : failed ? "Tu mensaje no se envió" : "Mensaje enviado"}</strong><p>{status}</p></>}</div>
            {delivered ? <button type="button" className={styles.submit} onClick={() => { setDelivered(false); setStatus(""); }}>Escribir otro mensaje</button> : <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>{pending ? "Enviando…" : "Enviar mensaje"}</button>}
            <p id="contact-note" className={styles.note}>Usaremos tu correo para responderte. También puedes <a href={marketingContact.whatsapp} target="_blank" rel="noopener noreferrer">escribirnos por WhatsApp</a>.</p>
          </form>
        </div>
      </div>
    </div>
  </section></Localized>;
}

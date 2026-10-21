"use client";
import { Localized } from "./localized";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { MarketingCaptcha } from "./marketing-captcha";
import styles from "./footer.module.css";

export function Newsletter() {
  const [expanded, setExpanded] = useState(false);
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const captchaError = useCallback(() => { setToken(""); }, []);
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!expanded) { setExpanded(true); setNotice("Autoriza la suscripción y completa la verificación."); return; }
    if (!token) { setNotice("Completa la verificación de seguridad."); return; }
    const form = event.currentTarget; const fields = new FormData(form);
    setPending(true); setNotice("Solicitando confirmación…");
    try {
      const result = await fetch("/api/boletin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: fields.get("email"), website: fields.get("website"), consent: fields.get("consent") === "on", captchaToken: token }) });
      const body = await result.json(); setNotice(body.message || "No se pudo completar la solicitud.");
      if (result.ok) { form.reset(); setExpanded(false); }
    } catch { setNotice("No se pudo conectar. Inténtalo más tarde."); }
    finally { setPending(false); setToken(""); setAttempt(value => value + 1); }
  }
  return <Localized><form className={styles.newsletter} onSubmit={subscribe} aria-describedby="newsletter-note">
    <label htmlFor="footer-email">Novedades de MiBazarPE</label>
    <div className={styles.subscribeRow}><input id="footer-email" name="email" type="email" autoComplete="email" placeholder="Tu correo electrónico" aria-label="Correo para el boletín" required maxLength={254} disabled={pending} /><button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Enviando…" : "Suscribirme"}</button></div>
    {expanded && <div className={styles.newsletterDetails}>
      <label className={styles.newsletterConsent}><input name="consent" type="checkbox" required disabled={pending} /><span>Quiero recibir novedades de MiBazarPE y autorizo el tratamiento de mi correo para este fin. He leído la <Link href="/legal/privacidad">política de privacidad</Link>. Puedo darme de baja en cualquier momento.</span></label>
      <MarketingCaptcha key={attempt} onToken={setToken} onError={captchaError} />
    </div>}
    <div className={styles.honeypot} aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <p id="newsletter-note" className={styles.newsletterNote} role="status">{notice || "Confirmarás tu suscripción por correo. Sin suscripción automática al crear una cuenta."}</p>
  </form></Localized>;
}

"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSocialAvailability, type SocialAvailability, type SocialProvider } from "@/features/auth/social";
import styles from "./auth.module.css";

export function AuthSocial({ loading, onSignIn }: { loading: boolean; onSignIn: (provider: SocialProvider) => Promise<void> }) {
  const [available, setAvailable] = useState<SocialAvailability | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<SocialProvider | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getSocialAvailability(controller.signal).then(setAvailable).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, []);
  return <div className={styles.socialSection}>
    <div className={styles.socialButtons}>
      {(["google", "github"] as const).map(provider => <Button key={provider} type="button" variant="outline"
        className={styles.socialButton} disabled={loading || !available?.[provider]}
        aria-describedby={!available?.[provider] ? "social-availability" : undefined}
        onClick={async () => { setActive(provider); try { await onSignIn(provider); } finally { setActive(null); } }}>
        {active === provider ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : provider === "github" ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.38ZM12 22c2.7 0 4.96-.9 6.62-2.39l-3.24-2.52c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22ZM6.41 13.94a6 6 0 0 1 0-3.88v-2.6H3.07a10 10 0 0 0 0 9.08l3.34-2.6ZM12 5.94c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.46l3.34 2.6C7.2 7.7 9.4 5.94 12 5.94Z" /></svg>}
        <span>Continuar con {provider === "google" ? "Google" : "GitHub"}</span>
      </Button>)}
    </div>
    <p id="social-availability" className={styles.socialAvailability} role="status">
      {failed ? "Acceso social no disponible por el momento." : !available ? "Comprobando acceso social…" : !available.google && !available.github ? "Google y GitHub estarán disponibles próximamente." : !available.google ? "Google estará disponible próximamente." : !available.github ? "GitHub estará disponible próximamente." : "Conecta tu cuenta y continúa."}
    </p>
    <div className={styles.divider}><span />o continúa con tu correo<span /></div>
  </div>;
}

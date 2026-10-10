"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: { sitekey: string; theme: "auto"; size: "flexible"; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }

export function AuthCaptcha({ onToken, onError }: { onToken: (token: string) => void; onError: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!ready || !sitekey || !container.current || !window.turnstile) return;
    const id = window.turnstile.render(container.current, { sitekey, theme: "auto", size: "flexible", callback: onToken, "expired-callback": () => onToken(""), "error-callback": onError });
    return () => window.turnstile?.remove(id);
  }, [ready, sitekey, onToken, onError]);
  if (!sitekey) return null;
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={onError} /><div ref={container} aria-label="Verificación de seguridad" /></>;
}

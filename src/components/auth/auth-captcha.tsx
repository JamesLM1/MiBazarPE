"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { mountCaptcha, type CaptchaFailure, type Turnstile } from "@/features/auth/captcha";
import { captchaConfig } from "@/features/auth/captcha-config";
import { mountHcaptcha, type Hcaptcha } from "@/features/auth/hcaptcha";

declare global {
  interface Window {
    turnstile?: Turnstile;
    hcaptcha?: Hcaptcha;
    miBazarHcaptchaReady?: boolean;
    onMiBazarHcaptchaReady?: () => void;
  }
}

type VerificationState = "loading" | "waiting" | "verifying" | "verified" | "error";

export function AuthCaptcha({ onToken, onError, onRetry }: {
  onToken: (token: string) => void;
  onError: (reason: CaptchaFailure) => void;
  onRetry?: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<VerificationState>("loading");
  const [takingLong, setTakingLong] = useState(false);
  const { sitekey, provider } = captchaConfig;
  const hcaptcha = provider === "hcaptcha";
  const handleReady = useCallback(() => {
    setReady(true);
    setTakingLong(false);
    setState(hcaptcha ? "waiting" : "verifying");
  }, [hcaptcha]);

  // hCaptcha's onload callback fires after SDK setup, later than script onLoad.
  // The document flag also covers cached scripts after client-side navigation.
  useEffect(() => {
    if (!hcaptcha) return;
    let active = true;
    const loaded = () => {
      window.miBazarHcaptchaReady = true;
      if (active) handleReady();
    };
    window.onMiBazarHcaptchaReady = loaded;
    if (window.miBazarHcaptchaReady) queueMicrotask(() => { if (active) handleReady(); });
    return () => { active = false; };
  }, [hcaptcha, handleReady]);

  useEffect(() => {
    if (!sitekey || ready) return;
    const timer = setTimeout(() => setTakingLong(true), 15000);
    return () => clearTimeout(timer);
  }, [sitekey, ready]);

  useEffect(() => {
    if (!ready || !sitekey || !container.current) return;
    const token = (value: string) => {
      onToken(value);
      setState(value ? "verified" : hcaptcha ? "waiting" : "verifying");
    };
    const fail = (reason: CaptchaFailure) => { setState("error"); onError(reason); };
    if (hcaptcha) {
      if (!window.hcaptcha) { fail("unavailable"); return; }
      return mountHcaptcha(window.hcaptcha, container.current, sitekey, token, fail);
    }
    if (!window.turnstile) { fail("unavailable"); return; }
    return mountCaptcha(window.turnstile, container.current, sitekey, token, fail);
  }, [ready, sitekey, hcaptcha, onToken, onError, attempt]);

  function retry() {
    onToken("");
    onRetry?.();
    if (hcaptcha ? !window.miBazarHcaptchaReady : !window.turnstile) { window.location.reload(); return; }
    setState(hcaptcha ? "waiting" : "verifying");
    setTakingLong(false);
    setAttempt(value => value + 1);
  }

  if (!sitekey) return null;
  return <>
    <Script
      src={hcaptcha ? "https://js.hcaptcha.com/1/api.js?onload=onMiBazarHcaptchaReady&render=explicit&recaptchacompat=off&hl=es" : "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"}
      onReady={() => { if (!hcaptcha || window.miBazarHcaptchaReady) handleReady(); }}
      onError={() => { setState("error"); onError("unavailable"); }}
    />
    <div className="space-y-2">
      <div ref={container} aria-label="Verificación de seguridad" />
      {state !== "verified" && state !== "waiting" && <p role="status" className="text-xs text-muted-foreground">
        {state === "error" ? "No se pudo mostrar o completar la verificación. Puedes volver a intentarlo." : takingLong ? "La verificación está tardando más de lo esperado. Si no ves el recuadro, vuelve a intentarlo." : "Cargando verificación de seguridad…"}
      </p>}
      {(state === "error" || takingLong) && <button type="button" onClick={retry} className="rounded px-2 py-1 text-sm underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Reintentar verificación</button>}
      <p className="text-xs text-muted-foreground">{hcaptcha ? "Marca la casilla y completa el desafío visual para continuar." : "La verificación puede completarse automáticamente. Si se solicita, marca la casilla para continuar."}</p>
    </div>
  </>;
}

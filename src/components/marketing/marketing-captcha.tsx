"use client";
import { useSyncExternalStore } from "react";
import { AuthCaptcha } from "@/components/auth/auth-captcha";
import type { CaptchaFailure } from "@/features/auth/captcha";

const subscribe = () => () => {};
export function MarketingCaptcha(props: { onToken: (token: string) => void; onError: (reason: CaptchaFailure) => void }) {
  const local = useSyncExternalStore(subscribe, () => window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1", () => false);
  if (local) return <p className="text-xs leading-6 text-muted-foreground">La verificación no admite localhost. <a className="text-primary underline" href="http://mibazarpe.localhost:3000/#contacto">Abre MiBazarPE con el dominio local habilitado</a> para usar los formularios.</p>;
  return <AuthCaptcha {...props} />;
}

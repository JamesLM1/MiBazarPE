"use client";

// Adapted from the installed @efferd/auth-5 registry block (radix-nova).
// Retains Auth 5 composition with the approved 40/60 split and compact form.
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type FocusEvent } from "react";
import { AtSignIcon, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useAuthVisualState } from "@/components/auth/auth-shell";
import { AuthSocial } from "@/components/auth/auth-social";
import { signInWithSocialProvider, type SocialProvider } from "@/features/auth/social";
import type { CaptchaFailure } from "@/features/auth/captcha";
import { captchaConfig } from "@/features/auth/captcha-config";
import { AuthCaptcha } from "@/components/auth/auth-captcha";
import { authErrorMessage } from "@/features/auth/errors";
import { validateAuthFields } from "@/features/auth/validation";
import { signOut, submitAuth, subscribeToAuthChanges } from "@/features/auth/service";
import type { AuthFieldErrors, AuthFields, AuthMascotState, AuthMode } from "@/features/auth/types";
import styles from "./auth/auth.module.css";

const content = {
  login: { title: "Bienvenido de nuevo", description: "Ingresa a tu cuenta de MiBazarPE.", button: "Iniciar sesión", pending: "Iniciando sesión…" },
  register: { title: "Crea tu cuenta", description: "Empieza a organizar tu bazar con MiBazarPE.", button: "Crear cuenta", pending: "Creando cuenta…" },
  recover: { title: "Recupera tu contraseña", description: "Te enviaremos un enlace para recuperar el acceso.", button: "Enviar enlace", pending: "Enviando enlace…" },
  reset: { title: "Elige una nueva contraseña", description: "Actualiza la contraseña de tu cuenta de MiBazarPE.", button: "Guardar contraseña", pending: "Guardando contraseña…" },
} as const;
const emptyFields: AuthFields = { name: "", email: "", password: "", confirmation: "" };

function Brand({ className }: { className?: string }) {
  return <Link href="/" className={className} aria-label="MiBazarPE — Inicio"><Image src="/brand/mibazarpe-logo.png" alt="MiBazarPE" width={2172} height={724} unoptimized className="h-auto w-36" /></Link>;
}

export function AuthPage({ mode, authenticated, notice }: { mode: AuthMode; authenticated: boolean; notice?: string }) {
  const copy = content[mode];
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const busy = useRef(false);
  const [fields, setFields] = useState(emptyFields);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [signedIn, setSignedIn] = useState(authenticated);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mascotState, setMascotState] = useState<AuthMascotState>("idle");
  const setVisualState = useAuthVisualState();
  useEffect(() => { setVisualState?.(mascotState); }, [mascotState, setVisualState]);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const captchaRequired = Boolean(captchaConfig.sitekey);
  const [captchaMessage, setCaptchaMessage] = useState("");
  const captchaError = useCallback((reason: CaptchaFailure) => {
    setCaptchaToken("");
    setCaptchaMessage(reason === "unsupported"
      ? "Tu navegador no admite la verificación de seguridad. Prueba con una versión actualizada."
      : reason === "timeout"
        ? "La verificación de seguridad venció. Complétala de nuevo para continuar."
        : "No se pudo completar la verificación de seguridad. Pulsa Reintentar verificación; si persiste, recarga la página.");
  }, []);
  const captchaVerified = useCallback((token: string) => {
    setCaptchaToken(token);
    if (token) setCaptchaMessage("");
  }, []);
  const captchaRetry = useCallback(() => setCaptchaMessage(""), []);
  const sessionScreen = signedIn && mode !== "reset";
  const resetUnavailable = mode === "reset" && !signedIn;
  const finished = Boolean(success) || sessionScreen;

  useEffect(() => subscribeToAuthChanges(isAuthenticated => {
    setSignedIn(isAuthenticated);
    // A logout from another tab must also clear this tab's success screen.
    if (!isAuthenticated) {
      setSuccess("");
      setFields(emptyFields);
      setShowPassword(false);
      setMascotState("idle");
    }
  }), []);

  function update(field: keyof AuthFields, value: string) {
    setFields(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setError("");
  }
  function focus(event: FocusEvent<HTMLFormElement>) {
    if (loading) return;
    const field = event.target.getAttribute("name");
    setMascotState(field === "email" ? "email" : field === "password" || field === "confirmation" ? (showPassword ? "password-visible" : "password") : "idle");
  }
  function togglePassword() {
    setShowPassword(current => !current);
    setMascotState(showPassword ? "password" : "password-visible");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const invalid = validateAuthFields(mode, fields);
    setErrors(invalid);
    setError("");
    if (Object.keys(invalid).length) {
      setMascotState("error");
      const first = Object.keys(invalid)[0];
      form.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (captchaRequired && !captchaToken && mode !== "reset") { setCaptchaMessage("Completa la verificación de seguridad para continuar."); return; }
    busy.current = true;
    setLoading(true);
    setMascotState("loading");
    try {
      const result = await submitAuth(mode, fields, captchaToken || undefined);
      setSuccess(result.message);
      setSignedIn(result.authenticated);
      setFields(emptyFields);
      setShowPassword(false);
      setMascotState("success");
      router.refresh();
    } catch (cause) {
      setError(authErrorMessage(cause));
      setMascotState("error");
    } finally {
      busy.current = false;
      setLoading(false);
      setCaptchaToken("");
      setCaptchaVersion(value => value + 1);
    }
  }
  async function logout() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try { await signOut(); setSignedIn(false); setSuccess(""); setError(""); setMascotState("idle"); router.replace("/login"); router.refresh(); }
    catch (cause) { setError(authErrorMessage(cause)); }
    finally { busy.current = false; setLoading(false); }
  }
  async function socialLogin(provider: SocialProvider) {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try { await signInWithSocialProvider(provider); }
    catch (cause) { setError(authErrorMessage(cause)); }
    finally { busy.current = false; setLoading(false); }
  }
  function fieldError(field: keyof AuthFields) { return errors[field] ? <p id={`${field}-error`} className={styles.fieldError}>{errors[field]}</p> : null; }

  return (
        <div className={`${styles.formContent} space-y-4`}>
          <Brand className={`mb-6 inline-flex lg:hidden ${styles.link}`} />
          <div className={styles.formHeading}>
            <p className={styles.eyebrow}>{mode === "register" ? "TU SIGUIENTE PASO" : "TU ESPACIO, CONECTADO"}</p>
            <h1 className={styles.title}>{copy.title}</h1>
            <p className="text-base text-muted-foreground">{copy.description}</p>
          </div>
          {notice && <p role="status" className={styles.notice}>{notice}</p>}
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {!finished && mode !== "reset" && captchaMessage && <p role="alert" className={styles.error}>{captchaMessage}</p>}
          {!finished && (mode === "login" || mode === "register") && <AuthSocial loading={loading} onSignIn={socialLogin} />}
          {finished ? <div className="space-y-4">
            <div role="status" className={styles.notice}><CheckCircle2 size={20} aria-hidden="true" className="mb-2 text-primary" />{success || "Ya has iniciado sesión en MiBazarPE."}</div>
            {signedIn ? <><Button asChild className="h-10 w-full"><Link href="/">Volver al inicio</Link></Button><Button className="h-10 w-full" variant="outline" disabled={loading} onClick={logout}>{loading ? "Cerrando sesión…" : "Cerrar sesión"}</Button></> : <Button asChild className="h-10 w-full" variant="outline"><Link href="/login">Ir a iniciar sesión</Link></Button>}
          </div> : resetUnavailable ? <div className="space-y-4"><p role="alert" className={styles.error}>Abre el enlace de recuperación enviado a tu correo para cambiar tu contraseña.</p><Button asChild className="h-10 w-full"><Link href="/recuperar-contrasena">Solicitar un enlace</Link></Button></div> : (
            <form ref={form} className="space-y-4" onSubmit={submit} onFocusCapture={focus} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget) && !loading) setMascotState(error ? "error" : "idle"); }} noValidate aria-busy={loading}>
              {mode === "register" && <div className="space-y-2">
                <label htmlFor="auth-name" className={styles.label}>Nombre completo</label>
                <InputGroup className={styles.inputGroup}><InputGroupInput id="auth-name" name="name" autoComplete="name" placeholder="Tu nombre completo" value={fields.name} onChange={e => update("name", e.target.value)} required maxLength={150} disabled={loading} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} /><InputGroupAddon><UserRound aria-hidden="true" /></InputGroupAddon></InputGroup>
                {fieldError("name")}
              </div>}
              {mode !== "reset" && <div className="space-y-2">
                <label htmlFor="auth-email" className={styles.label}>Correo electrónico</label>
                <InputGroup className={styles.inputGroup}><InputGroupInput id="auth-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="tu@correo.com" value={fields.email} onChange={e => update("email", e.target.value)} required maxLength={254} disabled={loading} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} /><InputGroupAddon><AtSignIcon aria-hidden="true" /></InputGroupAddon></InputGroup>
                {fieldError("email")}
              </div>}
              {mode !== "recover" && <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor="auth-password" className={styles.label}>Contraseña</label>{mode === "login" && <Link href="/recuperar-contrasena" className={`${styles.link} text-xs text-muted-foreground hover:text-primary`}>¿Olvidaste tu contraseña?</Link>}</div>
                <InputGroup className={styles.inputGroup}><InputGroupInput id="auth-password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={fields.password} onChange={e => update("password", e.target.value)} required maxLength={128} disabled={loading} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : mode !== "login" ? "password-help" : undefined} /><InputGroupAddon><LockKeyhole aria-hidden="true" /></InputGroupAddon><InputGroupAddon align="inline-end"><button type="button" onClick={togglePassword} disabled={loading} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} className={styles.visibility}>{showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button></InputGroupAddon></InputGroup>
                {mode !== "login" && <p id="password-help" className="text-xs text-muted-foreground">Usa al menos 10 caracteres. Combina letras, números y símbolos.</p>}
                {fieldError("password")}
              </div>}
              {(mode === "register" || mode === "reset") && <div className="space-y-2">
                <label htmlFor="auth-confirmation" className={styles.label}>Confirmar contraseña</label>
                <InputGroup className={styles.inputGroup}><InputGroupInput id="auth-confirmation" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" value={fields.confirmation} onChange={e => update("confirmation", e.target.value)} required maxLength={128} disabled={loading} aria-invalid={Boolean(errors.confirmation)} aria-describedby={errors.confirmation ? "confirmation-error" : undefined} /><InputGroupAddon><LockKeyhole aria-hidden="true" /></InputGroupAddon></InputGroup>
                {fieldError("confirmation")}
              </div>}
              {mode !== "reset" && <AuthCaptcha key={captchaVersion} onToken={captchaVerified} onError={captchaError} onRetry={captchaRetry} />}
              <Button type="submit" className="h-10 w-full" disabled={loading}>{loading && <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}{loading ? copy.pending : copy.button}</Button>
            </form>
          )}
          <p className="mt-8 text-sm text-muted-foreground">
            {mode === "login" ? <>¿Aún no tienes una cuenta? <Link href="/registro" className={`${styles.link} underline underline-offset-4 hover:text-primary`}>Crear cuenta</Link></> : mode === "register" ? <>¿Ya tienes una cuenta? <Link href="/login" className={`${styles.link} underline underline-offset-4 hover:text-primary`}>Iniciar sesión</Link></> : <Link href="/login" className={`${styles.link} underline underline-offset-4 hover:text-primary`}>Volver a iniciar sesión</Link>}
          </p>
        </div>
  );
}

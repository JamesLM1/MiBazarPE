"use client";
import { useActionState, useSyncExternalStore, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Copy, LoaderCircle, Save } from "lucide-react";
import type { AccessState } from "@/features/access/actions";
import { acceptInvitation } from "@/features/access/actions";
import { FormHelp } from "./form-help";
import styles from "./operations.module.css";
export function AccessForm({action,children,label="Guardar",id}: {action:(state:AccessState,data:FormData)=>Promise<AccessState>;children:ReactNode;label?:string;id?:string}) {
 const [state,submit,pending]=useActionState(action,{});
 const [copied,setCopied]=useState(false);
 async function copy() {if(!state.token)return;try {await navigator.clipboard.writeText(`${window.location.origin}/invitacion#${state.token}`);setCopied(true);} catch {setCopied(false);}}
 return <form id={id} action={submit} className={styles.form} aria-busy={pending}><div className={styles.formHint}><FormHelp><p>Completa los campos obligatorios y revisa las indicaciones junto a ellos. Los importes monetarios admiten dos decimales. Al guardar se valida tu acceso al negocio y se revisan los datos; si algo falta aparecerá un mensaje debajo del botón.</p><p>Los cambios de precios y condiciones financieras se aplican a operaciones futuras. El historial registrado se conserva.</p></FormHelp></div>{children}<div className={styles.formActions}><button type="submit" className={styles.submit} disabled={pending}>{pending?<LoaderCircle size={16} className={styles.loadingIcon} aria-hidden="true"/>:<Save size={16} aria-hidden="true"/>}{pending?"Guardando…":label}</button></div>{state.error&&<p className={styles.formError} role="alert">{state.error}</p>}{state.success&&<p className={styles.formSuccess} role="status">{state.success}</p>}{state.token&&<div className={styles.formHint}><button type="button" className={styles.addItem} onClick={()=>void copy()}>{copied?<Check size={16} aria-hidden="true"/>:<Copy size={16} aria-hidden="true"/>}{copied?"Enlace copiado":"Copiar enlace de invitación"}</button><p className={styles.shareToken}>Si no puedes copiar el enlace, comparte este código:<br/><code>{state.token}</code></p></div>}</form>;
}
export function AcceptInvitationForm() {
 const hash=useSyncExternalStore(subscribeHash,readHash,emptyHash);
 const [editedToken,setToken]=useState<string|null>(null);
 const token=editedToken??hash;
 return <AccessForm action={acceptInvitation} label="Aceptar invitación"><label>Código de invitación<input name="token" required value={token} onChange={event=>setToken(event.target.value)} autoComplete="off" maxLength={72}/></label><p className={styles.formHint}>Debes usar el correo destinatario. <Link href="/portal">Mi cuenta cliente</Link> · <Link href="/dashboard">Dashboard</Link></p></AccessForm>;
}
function subscribeHash(listener:()=>void){window.addEventListener('hashchange',listener);return ()=>window.removeEventListener('hashchange',listener);}
function readHash(){return window.location.hash.slice(1);}
function emptyHash(){return '';}

import { RevealHeading } from "@/components/app-shell/reveal-heading";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPrivateContext } from "@/features/dashboard/context";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import { saveBusiness } from "@/features/access/actions";
import { AccessForm } from "./access-form";
import styles from "./operations.module.css";
function Fields({business,create=false}:{business?:Record<string,unknown>;create?:boolean}) {
 const fields=[['nombre','Nombre comercial','nombre_comercial'],['razon_social','Razón social','razon_social'],['ruc','RUC','ruc'],['direccion','Dirección','direccion'],['distrito','Distrito','distrito'],['provincia','Provincia','provincia'],['departamento','Departamento','departamento'],['telefono','Celular','telefono'],['correo','Correo de contacto','correo']];
 return <>{create&&<input type="hidden" name="create" value="yes"/>}{fields.map(([name,label,column])=><label key={name}>{label}<input name={name} defaultValue={String(business?.[column]??'')} required={['nombre','razon_social','ruc','direccion'].includes(name)} type={name==='correo'?'email':'text'} readOnly={name==='ruc'&&!create} maxLength={name==='ruc'?11:name==='telefono'?9:240} pattern={name==='ruc'?'[0-9]{11}':name==='telefono'?'9[0-9]{8}':undefined}/></label>)}{!create&&<label className={styles.consent}><input name="pagos_parciales" type="checkbox" value="yes" defaultChecked={business?.permite_pagos_parciales===true}/>Permitir pagos parciales de cuotas. Cada abono conserva su aplicación a mora, interés y capital.</label>}</>;
}
export async function BusinessSettings({create=false}:{create?:boolean}) {
 const context=await getPrivateContext(); if(context.user.role==='CLIENTE')redirect('/portal');
 if(!context.user.role)return <div className={styles.error}>Primero completa tu identidad en <Link href="/perfil">Mi perfil</Link>.</div>;
 const db=await getSupabaseServerClient();
 const result=!create&&context.business?await db.from('bazares').select('*').eq('id_bazar',context.business.id).single():null;
 if(result?.error)return <p role="alert" className={styles.error}>No se pudo cargar el negocio. Vuelve a intentarlo.</p>;
 return <section className={styles.page}><header className={styles.heading}><div><p className={styles.eyebrow}>TU ESPACIO DE TRABAJO</p><RevealHeading>{create?'Crear un negocio':'Mi negocio'}</RevealHeading><p>Datos del establecimiento y reglas para registrar sus operaciones.</p></div><Link className={styles.business} href={create?'/mi-negocio':'/mi-negocio/nuevo'}>{create?'Volver':'Crear otro negocio'}</Link></header>{result?.data?.id_lote_demo&&<p className={styles.notice}>Este es un bazar de demostración. Crea otro negocio para comenzar con datos reales.</p>}{!create&&!context.business?<div className={styles.error}>Todavía no tienes un negocio. <Link href="/mi-negocio/nuevo">Crear mi primer negocio</Link></div>:<section className={styles.formCard}><div className={styles.formHeading}><h2>{create?'Registra tu establecimiento':context.business?.name}</h2><p>Usa los datos reales de tu negocio. El RUC se conserva tras el alta.</p></div><AccessForm action={saveBusiness} label={create?'Crear negocio':'Guardar configuración'}><Fields business={result?.data} create={create}/></AccessForm></section>}</section>;
}

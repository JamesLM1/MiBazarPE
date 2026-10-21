"use client";
import {useState,useTransition} from 'react';
import {searchOperationOptions} from '@/features/operations/actions';
import type {Option} from './operation-form';
import styles from './operations.module.css';
export function SearchableOption({kind,label,name,initial,value,onChange,required=true,emptyLabel='Selecciona una opción'}:{kind:string;label:string;name:string;initial:Option[];value?:string;onChange?:(v:string)=>void;required?:boolean;emptyLabel?:string}){
 const [options,setOptions]=useState(initial),[term,setTerm]=useState(''),[localValue,setLocalValue]=useState(''),[selected,setSelected]=useState<Option|null>(null),[error,setError]=useState(''),[searched,setSearched]=useState(false),[pending,startTransition]=useTransition();
 const current=value??localValue;const choices=selected&&!options.some(o=>o.id===selected.id)?[selected,...options]:options;
 function search(){startTransition(async()=>{const result=await searchOperationOptions(kind,term);setError(result.error??'');if(!result.error){setOptions(result.options);setSearched(true);}});}
 return <div className={styles.optionSearch}><label>{label}<select name={name} value={current} required={required} onChange={e=>{setLocalValue(e.target.value);onChange?.(e.target.value);setSelected(choices.find(o=>o.id===e.target.value)??null);}}><option value="" disabled={required}>{emptyLabel}</option>{choices.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label><div className={styles.optionSearchBar}><input type="search" aria-label={`Buscar ${label.toLocaleLowerCase('es')}`} maxLength={80} value={term} placeholder="Buscar más opciones…" onChange={e=>setTerm(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search();}}}/><button type="button" className={styles.addItem} disabled={pending} onClick={search}>{pending?'Buscando…':'Buscar'}</button></div>{error?<p role="alert" className={styles.formError}>{error}</p>:searched&&<small role="status">{options.length?`${options.length} resultados. Si no aparece, precisa el nombre o código.`:'Sin coincidencias. Prueba otro nombre o código.'}</small>}</div>;
}

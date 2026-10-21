"use client";
import { useState } from "react";
import Image from "next/image";
import { AccessForm } from "./access-form";
import { uploadProductPhoto } from "@/features/operations/product-image-actions";
import styles from "./operations.module.css";
export function ProductPhoto({ id, name, version }: { id: string; name: string; version: string | null }) {
  const [error, setError] = useState<string | null>(null);
  return <section className={styles.formCard}><h2>Fotografía del producto</h2>
    {version && <Image src={`/api/productos/${id}/foto?v=${encodeURIComponent(version.split('/').at(-1) ?? '')}`} width={240} height={240} unoptimized alt={`Fotografía de ${name}`} style={{ objectFit: 'contain', maxWidth: '100%', margin: '16px 0', borderRadius: 12 }}/>} 
    <AccessForm action={uploadProductPhoto} label="Guardar fotografía"><input type="hidden" name="id" value={id}/><label>Foto (JPG, PNG o WebP)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required onChange={event=>{const file=event.target.files?.[0];const message=file && file.size>750*1024?'La foto debe pesar como máximo 750 KB.':null;event.target.setCustomValidity(message??'');setError(message);}}/></label>
      <p className={styles.formHint}>Máximo 750 KB y 16 megapíxeles. Se adapta el tamaño y se eliminan los metadatos de la foto. La imagen se guarda de forma privada dentro de tu negocio.</p>{error&&<p role="alert" className={styles.formError}>{error}</p>}
    </AccessForm></section>;
}

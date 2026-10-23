"use client";
import { RevealHeading } from "@/components/app-shell/reveal-heading";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Download, FileSpreadsheet, FolderUp, History, Info, LoaderCircle, Package, ShieldCheck, Store, Upload, UsersRound } from "lucide-react";
import { fieldsFor, guessKind, suggestMapping, validateRows, type ImportKind, type ImportWorkbook } from "@/features/imports/model";
import { getImportHistory, importarCatalog, type ImportHistoryItem } from "@/features/imports/actions";
import type { Business } from "@/features/dashboard/types";
import styles from "./import-wizard.module.css";

type Review = { por_crear: number; creados: number; omitidos: number; duplicadas: number[]; importacion_id?: string; repetida: boolean };
const accepted = ".xlsx,.xls,.ods,.csv,.tsv,.txt,.json";
const templateHeaders = {
  productos: "codigo_sku,nombre,categoria,unidad_medida,precio_contado,precio_credito,stock_actual,stock_minimo,marca,descripcion,proveedor",
  clientes: "nombre_completo,tipo_documento,numero_documento,correo,telefono,direccion",
};
const examples = {
  productos: `${templateHeaders.productos}\nEJEMPLO-01,Cuaderno de muestra,Papelería,Unidad,8.50,9.00,24,5,Marca de muestra,Producto ficticio para explorar,Proveedor de muestra\nEJEMPLO-02,Lápiz de muestra,Papelería,Unidad,1.50,1.50,3,5,,,Proveedor de muestra`,
  clientes: `${templateHeaders.clientes}\nCliente de muestra Uno,DNI,00000001,cliente.uno@example.com,900000001,Dirección de muestra\nCliente de muestra Dos,DNI,00000002,cliente.dos@example.com,900000002,Dirección de muestra`,
};
function downloadText(name: string, value: string) {
  const url = URL.createObjectURL(new Blob(["\ufeff", value], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvCell(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function ImportWizard({ business, initialKind, businessSetup }: { business: Business | null; initialKind: ImportKind; businessSetup?: ReactNode }) {
  const [kind, setKind] = useState<ImportKind>(initialKind);
  const [workbook, setWorkbook] = useState<ImportWorkbook | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheetIndex, setSheetIndex] = useState(0);
  const [headerIndex, setHeaderIndex] = useState(0);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [decimal, setDecimal] = useState<"punto" | "coma">("punto");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excludeInvalid, setExcludeInvalid] = useState(false);
  const [consent, setConsent] = useState(false);
  const [acknowledge, setAcknowledge] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [receipt, setReceipt] = useState<Review | null>(null);
  const [sample, setSample] = useState(false);
  const [page, setPage] = useState(0);
  const [key, setKey] = useState("");
  const [pending, startTransition] = useTransition();
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const previousBusiness = useRef(business?.id);
  const [businessChanged, setBusinessChanged] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const worker = useRef<Worker | null>(null);
  const cancelParse = useRef<(() => void) | null>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const headers = workbook?.sheets[sheetIndex]?.rows[headerIndex]?.map(value => String(value ?? "")) ?? [];
  const fields = fieldsFor(kind);
  const rows = useMemo(() => workbook ? validateRows(workbook.sheets[sheetIndex].rows.slice(headerIndex + 1), mapping, kind, decimal, headerIndex + 2) : [], [workbook, sheetIndex, headerIndex, mapping, kind, decimal]);
  const valid = rows.filter(row => !row.errors.length);
  const invalid = rows.filter(row => row.errors.length);
  const changes = rows.filter(row => row.changes.length).length;
  const tooMany = rows.length > 500;
  const activeStep = receipt || review ? 3 : workbook ? 2 : 1;
  const canReview = valid.length > 0 && !tooMany && (invalid.length === 0 || excludeInvalid);

  useEffect(() => {
    if (previousBusiness.current === business?.id) return;
    previousBusiness.current = business?.id;
    setReview(null); setReceipt(null); setError(null); setConsent(false); setAcknowledge(false); setKey(crypto.randomUUID());
    setBusinessChanged(Boolean(business?.id));
  }, [business?.id]);

  useEffect(() => () => { cancelParse.current?.(); worker.current?.terminate(); }, []);
  useEffect(() => {
    if (!business) return;
    let current = true;
    getImportHistory(business.id).then(result => { if (current) { setHistory(result.items); setHistoryError(result.error); } }).catch(() => { if (current) setHistoryError("No pudimos consultar el historial. Vuelve a abrir esta página para reintentar."); });
    return () => { current = false; };
  }, [business, receipt]);
  useEffect(() => { if (review || receipt) stepHeading.current?.focus(); }, [review, receipt]);

  function invalidate() { setReview(null); setReceipt(null); setError(null); setConsent(false); setAcknowledge(false); setKey(crypto.randomUUID()); setPage(0); }
  function changeSheet(index: number, header: number, target = kind) {
    if (!workbook) return;
    const nextHeaders = workbook.sheets[index].rows[header]?.map(value => String(value ?? "")) ?? [];
    setSheetIndex(index); setHeaderIndex(header); setKind(target); setMapping(suggestMapping(nextHeaders, target)); setExcludeInvalid(false); invalidate();
  }
  function changeKind(target: ImportKind) { setKind(target); setMapping(suggestMapping(headers, target)); setExcludeInvalid(false); invalidate(); }
  async function load(file: File, isSample = false) {
    if (busy || pending) return;
    setBusy(true); setError(null); setReview(null); setReceipt(null);
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("El archivo supera 2 MB. Divide el catálogo en archivos más pequeños.");
      const buffer = await file.arrayBuffer();
      const parsed = await new Promise<ImportWorkbook>((resolve, reject) => {
        const instance = new Worker(new URL("../../features/imports/import.worker.ts", import.meta.url), { type: "module" });
        worker.current = instance;
        const done = () => { clearTimeout(timer); instance.terminate(); worker.current = null; cancelParse.current = null; };
        const timer = setTimeout(() => { done(); reject(new Error("La lectura tardó demasiado. Guarda una copia más pequeña como CSV UTF-8 y vuelve a intentarlo.")); }, 15000);
        cancelParse.current = done;
        instance.onmessage = (event: MessageEvent<{ ok: boolean; workbook?: ImportWorkbook; error?: string }>) => { done(); if (event.data.ok && event.data.workbook) resolve(event.data.workbook); else reject(new Error(event.data.error || "No pudimos leer este archivo.")); };
        instance.onerror = () => { done(); reject(new Error("No pudimos abrir el lector. Recarga la página y vuelve a intentarlo.")); };
        instance.postMessage({ buffer, fileName: file.name }, [buffer]);
      });
      const first = parsed.sheets[0];
      const index = Math.max(0, first.rows.findIndex(row => row.some(cell => String(cell ?? "").trim())));
      const foundHeaders = first.rows[index].map(cell => String(cell ?? ""));
      const detected = guessKind(foundHeaders) ?? kind;
      setWorkbook(parsed); setSheetIndex(0); setHeaderIndex(index); setKind(detected); setMapping(suggestMapping(foundHeaders, detected));
      setFileName(file.name); setSample(isSample); setExcludeInvalid(false); setDecimal("punto"); invalidate();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos leer el archivo."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  function beginReview() {
    if (!canReview || pending) return;
    setError(null); setAcknowledge(false);
    if (!business || sample) { setReview({ por_crear: valid.length, creados: 0, omitidos: 0, duplicadas: [], repetida: false }); return; }
    startTransition(async () => {
      try {
        const answer = await importarCatalog({ businessId: business.id, type: kind, rows: valid.map(row => row.data), key, fileName, confirm: false, consent: false });
        if (answer.error || !answer.result) setError(answer.error || "No pudimos revisar los datos.");
        else if (answer.result.repetida) setReceipt(answer.result);
        else setReview(answer.result);
      } catch { setError("No se pudo conectar para revisar los datos. Inténtalo otra vez."); }
    });
  }
  function confirm() {
    if (!business || !review || sample || pending || !acknowledge || (kind === "clientes" && !consent)) return;
    setError(null);
    startTransition(async () => {
      try {
        const answer = await importarCatalog({ businessId: business.id, type: kind, rows: valid.map(row => row.data), key, fileName, confirm: true, consent });
        if (answer.error || !answer.result) setError(answer.error || "No pudimos guardar la importación.");
        else { setReceipt(answer.result); setReview(null); }
      } catch { setError("La conexión se interrumpió. Puedes reintentar esta misma importación; su identificador evita crearla dos veces."); }
    });
  }
  function reset() { setWorkbook(null); setFileName(""); setMapping({}); setSample(false); setExcludeInvalid(false); invalidate(); }
  function exportErrors() {
    downloadText("errores-importacion.csv", "fila,errores\n" + invalid.map(row => `${row.sourceRow},${csvCell(row.errors.join(" · "))}`).join("\n"));
  }

  return <section className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>MENOS DIGITACIÓN, MÁS TIEMPO PARA TU NEGOCIO</p><RevealHeading>Tu catálogo, listo para trabajar</RevealHeading><p>Trae tus productos o clientes desde una hoja de cálculo. Te ayudamos a ordenar las columnas y revisar cada registro antes de guardarlo.</p></div><span className={styles.business}><Store size={16} aria-hidden="true" />{business?.name ?? "Vista previa · sin negocio"}</span></header>
    {!business && <div className={styles.notice}><Info size={18} aria-hidden="true" /><p>Tu cuenta de dueño todavía no tiene un establecimiento seleccionado. Puedes revisar tu archivo y crear el negocio aquí en el paso 3, sin perder la carga. Importar productos o clientes no registra ventas.</p></div>}
    {businessChanged && business && workbook && !review && !receipt && <div role="status" className={styles.success}><CheckCircle2 size={18} aria-hidden="true"/><p>«{business.name}» está seleccionado. Tu archivo sigue cargado: pulsa Revisar antes de guardar para comprobar duplicados en este negocio.</p></div>}
    <ol className={styles.steps} aria-label="Pasos de importación">{["Elige tu archivo", "Ordena y revisa", "Confirma y guarda"].map((label, index) => <li key={label} data-active={activeStep === index + 1} aria-current={activeStep === index + 1 ? "step" : undefined}><span>{activeStep > index + 1 ? <Check size={15} aria-hidden="true" /> : index + 1}</span>{label}</li>)}</ol>
    {error && <div role="alert" className={styles.error}><Info size={18} aria-hidden="true" /><p>{error}</p></div>}

    {!review && !receipt && <section className={styles.panel} aria-busy={busy || pending}>
      <div className={styles.panelHead}><div><h2>{workbook ? "Archivo cargado. Hagamos que encaje." : "¿Qué quieres traer a tu negocio?"}</h2><p>Los productos y los clientes se importan por separado. Si tu libro tiene varias hojas, elige una cada vez.</p></div>{workbook && <button className={styles.secondary} onClick={reset} disabled={busy || pending}>Cambiar archivo</button>}</div>
      <div className={styles.body}>
        <div className={styles.types} role="group" aria-label="Tipo de registros"><button className={styles.type} aria-pressed={kind === "productos"} onClick={() => changeKind("productos")} disabled={busy || pending}><Package size={25} aria-hidden="true" /><span><strong>Productos</strong><small>Precios, categorías y stock inicial.</small></span></button><button className={styles.type} aria-pressed={kind === "clientes"} onClick={() => changeKind("clientes")} disabled={busy || pending}><UsersRound size={25} aria-hidden="true" /><span><strong>Clientes</strong><small>Identidad y datos de contacto.</small></span></button></div>
        {!workbook ? <>
          <div className={styles.drop} data-drag={drag} onDragOver={event => { event.preventDefault(); if (!busy) setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={event => { event.preventDefault(); setDrag(false); if (event.dataTransfer.files.length !== 1) setError("Selecciona un solo archivo para revisar sus hojas."); else if (event.dataTransfer.files[0]) void load(event.dataTransfer.files[0]); }}>
            <span className={styles.fileIcon}><FileSpreadsheet size={30} aria-hidden="true" /></span><h3>{busy ? "Leyendo y organizando tu archivo…" : "Arrastra tu archivo aquí"}</h3><p>Excel (.xlsx, .xls), LibreOffice (.ods), CSV, TSV, TXT delimitado o JSON tabular.<br />Hasta 2 MB y 500 registros por importación. Los archivos CSV y TXT deben estar en UTF-8.</p>
            <input ref={input} className={styles.fileInput} type="file" accept={accepted} tabIndex={-1} aria-label="Archivo para importar" onChange={event => { if (event.target.files?.[0]) void load(event.target.files[0]); }} disabled={busy || pending} />
            <button type="button" className={styles.primary} onClick={() => input.current?.click()} disabled={busy}>{busy ? <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> : <FolderUp size={17} aria-hidden="true" />}Elegir archivo</button>
          </div>
          <div className={styles.template}><p>¿Aún no tienes un archivo? Empieza con las columnas correctas.</p><div className={styles.actions}><button className={styles.quiet} onClick={() => downloadText(`plantilla-${kind}.csv`, templateHeaders[kind] + "\n")}><Download size={15} aria-hidden="true" />Descargar plantilla</button><button className={styles.secondary} disabled={busy} onClick={() => void load(new File([examples[kind]], `ejemplo-${kind}.csv`, { type: "text/csv" }), true)}>Probar con un ejemplo<ArrowRight size={15} aria-hidden="true" /></button></div></div>
          <p className={styles.hint}>La lectura se realiza en tu navegador. Solo enviamos los registros revisados al comprobar duplicados o confirmar. No se importan deudas, ventas históricas, imágenes ni documentos PDF.</p>
        </> : <>
          <div className={styles.notice}><FileSpreadsheet size={18} aria-hidden="true" /><p className={styles.fileName}><strong>{fileName}</strong>{sample ? " · Archivo ficticio: solo vista previa, no se guarda en tu negocio." : " · Comprueba las columnas propuestas y los valores normalizados."}</p></div>
          <div className={styles.settings}>
            <label className={styles.field}>Hoja del archivo<select value={sheetIndex} onChange={event => { const next = Number(event.target.value); const head = Math.max(0, workbook.sheets[next].rows.findIndex(row => row.some(cell => String(cell ?? "").trim()))); changeSheet(next, head); }} disabled={pending}>{workbook.sheets.map((sheet, index) => <option key={index} value={index}>{sheet.name}</option>)}</select></label>
            <label className={styles.field}>Fila de los encabezados<select value={headerIndex} onChange={event => changeSheet(sheetIndex, Number(event.target.value))} disabled={pending}>{workbook.sheets[sheetIndex].rows.slice(0, 20).map((_, index) => <option key={index} value={index}>Fila {index + 1}</option>)}</select></label>
            <label className={styles.field}>Formato de los importes<select value={decimal} onChange={event => { setDecimal(event.target.value as "punto" | "coma"); invalidate(); }} disabled={pending}><option value="punto">Punto decimal: 1,234.50</option><option value="coma">Coma decimal: 1.234,50</option></select></label>
          </div>
          <details open className={styles.details}><summary><ChevronRight size={16} aria-hidden="true" />Relaciona tus columnas <span className={styles.hint}>* obligatorio</span></summary><div className={styles.mapping}>{fields.map(field => <label className={styles.field} key={field.key}><span>{field.label}{field.required && <span className={styles.required}> *</span>}</span><select value={mapping[field.key] ?? -1} onChange={event => { setMapping(current => ({ ...current, [field.key]: Number(event.target.value) })); invalidate(); }} disabled={pending}><option value={-1}>{field.required ? "Selecciona una columna" : "Sin columna · usar valor predeterminado"}</option>{headers.map((header, index) => <option key={index} value={index}>{index + 1}. {header || "Sin título"}</option>)}</select><small>{field.hint ?? (field.required ? "El archivo debe contener este dato." : "Opcional.")}</small></label>)}</div></details>
        </>}
      </div>
    </section>}

    {workbook && !review && !receipt && <section className={styles.panel}>
      <div className={styles.panelHead}><div><h2>Vista previa de tus registros</h2><p>Revisa los ajustes de espacios, formatos y valores predeterminados. No hemos guardado ningún registro.</p></div><ShieldCheck size={24} color="var(--ws-accent-ink)" aria-hidden="true" /></div>
      <div className={styles.body}>
        <div className={styles.stats}><div className={styles.stat}><strong>{rows.length}</strong><span>Filas encontradas</span></div><div className={styles.stat} data-tone="good"><strong>{valid.length}</strong><span>Listas para revisar</span></div><div className={styles.stat} data-tone="bad"><strong>{invalid.length}</strong><span>Con errores</span></div><div className={styles.stat} data-tone="blue"><strong>{changes}</strong><span>Con ajustes propuestos</span></div></div>
        {tooMany && <p className={styles.error} role="alert">Elige un archivo con un máximo de 500 registros. No se recortará tu catálogo automáticamente.</p>}
        <div className={styles.scroll} tabIndex={0} aria-label="Vista previa desplazable de los registros"><table className={styles.table}><thead><tr><th scope="col">Fila</th><th scope="col">Revisión</th>{fields.map(field => <th scope="col" key={field.key}>{field.label}</th>)}</tr></thead><tbody>{rows.slice(page * 20, page * 20 + 20).map(row => <tr key={row.sourceRow} data-invalid={Boolean(row.errors.length)}><td>{row.sourceRow}</td><td className={styles.rowStatus}>{row.errors.length ? <span className={styles.invalid}>{row.errors.join(" · ")}</span> : <span className={styles.valid}>✓ Lista para revisar</span>}{row.changes.length > 0 && <div className={styles.changed}>{row.changes.join(" · ")}</div>}</td>{fields.map(field => <td key={field.key} title={String(row.data[field.key] ?? "")}>{String(row.data[field.key] ?? "—")}</td>)}</tr>)}</tbody></table>{!rows.length && <div className={styles.empty}>No encontramos filas después de los encabezados. Elige otra hoja o revisa la fila del título.</div>}</div>
        {rows.length > 20 && <div className={styles.pager}><span>Filas {page * 20 + 1}–{Math.min(page * 20 + 20, rows.length)} de {rows.length}</span><div className={styles.actions}><button className={styles.secondary} disabled={page === 0 || pending} onClick={() => setPage(current => current - 1)}>Anterior</button><button className={styles.secondary} disabled={(page + 1) * 20 >= rows.length || pending} onClick={() => setPage(current => current + 1)}>Siguiente</button></div></div>}
        {invalid.length > 0 && <><div className={styles.footer}><p className={styles.hint}>Corrige el archivo y vuelve a cargarlo, o excluye de forma explícita las filas con errores.</p><button className={styles.quiet} onClick={exportErrors}><Download size={15} aria-hidden="true" />Descargar errores</button></div><label className={styles.check}><input type="checkbox" checked={excludeInvalid} disabled={pending} onChange={event => { setExcludeInvalid(event.target.checked); invalidate(); }} />Excluir las filas con errores ({invalid.length}) y continuar con los registros válidos ({valid.length}).</label></>}
        <div className={styles.footer}><p className={styles.hint}>Los registros existentes se conservarán. Comprobaremos SKU o documento dentro de tu negocio.</p><button className={styles.primary} onClick={beginReview} disabled={!canReview || pending}>{pending ? <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}Revisar antes de guardar<ArrowRight size={15} aria-hidden="true" /></button></div>
      </div>
    </section>}

    {review && <section className={styles.panel} aria-busy={pending}><div className={styles.panelHead}><div><h2 ref={stepHeading} tabIndex={-1}>Todo a la vista, antes de guardar</h2><p className={styles.fileName}>{fileName} · {kind === "productos" ? "Catálogo de productos" : "Agenda de clientes"}</p></div><CheckCircle2 size={25} color="var(--ws-success)" aria-hidden="true" /></div><div className={styles.body}>
      <dl className={styles.reviewList}><div><dt>Registros nuevos</dt><dd>{review.por_crear}</dd></div><div><dt>Ya existen · se omiten</dt><dd>{review.omitidos}</dd></div><div><dt>Excluidos por errores</dt><dd>{invalid.length}</dd></div></dl>
      {review.duplicadas.length > 0 && <p className={styles.hint}>Ya existen en el negocio: filas {review.duplicadas.map(index => valid[index - 1]?.sourceRow ?? index).join(", ")}. No se cambiarán sus datos ni su stock.</p>}
      <div className={styles.notice}><Info size={18} aria-hidden="true" /><p>{kind === "productos" ? "El stock inicial creará movimientos de apertura de inventario. Los precios están expresados en soles. Esta carga no registra ventas ni ingresos de caja." : "Se crearán fichas de clientes con sus datos de contacto. Sus cuentas de acceso y líneas de crédito se habilitan después, desde Clientes e Invitaciones."}</p></div>
      {sample ? <div className={styles.success}><CheckCircle2 size={18} aria-hidden="true" /><p><strong>Así funciona la revisión.</strong>Este ejemplo no guarda registros. Cuando estés listo, carga tu propio archivo.</p></div> : !business ? <div className={styles.notice}><Store size={18} aria-hidden="true" /><p>La revisión del archivo está lista. Falta crear el establecimiento donde guardarás estos datos. Completa el formulario de abajo: conservarás el archivo y después podrás comprobar duplicados y confirmar.</p></div> : <>
        {kind === "clientes" && <label className={styles.check}><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={pending} />Confirmo que cuento con autorización para registrar y tratar los datos de estos clientes en mi negocio.</label>}
        <label className={styles.check}><input type="checkbox" checked={acknowledge} onChange={event => setAcknowledge(event.target.checked)} disabled={pending} />He revisado los datos y los ajustes. Quiero importar {review.por_crear} registros de {kind} en «{business.name}».</label>
      </>}
      {!business && !sample && businessSetup}
      <div className={styles.footer}><button className={styles.secondary} onClick={() => { setReview(null); setAcknowledge(false); }} disabled={pending}><ArrowLeft size={15} aria-hidden="true" />Volver a revisar</button>{sample ? <button className={styles.primary} onClick={reset}>Cargar mi archivo<Upload size={16} aria-hidden="true" /></button> : business ? <button className={styles.primary} onClick={confirm} disabled={pending || !acknowledge || (kind === "clientes" && !consent) || review.por_crear === 0}>{pending ? <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}{pending ? "Guardando registros…" : `Confirmar ${review.por_crear} ${review.por_crear === 1 ? "registro" : "registros"}`}</button> : !businessSetup ? <Link className={styles.primary} href="/mi-negocio/nuevo">Crear mi negocio<ArrowRight size={15} aria-hidden="true" /></Link> : null}</div>
    </div></section>}

    {receipt && <section className={styles.panel}><div className={styles.body}><div className={styles.result}><CheckCircle2 aria-hidden="true" /><h2 ref={stepHeading} tabIndex={-1}>{receipt.repetida ? "Esta importación ya estaba guardada" : "Tu catálogo está actualizado"}</h2><p>{receipt.creados} registros de {kind} creados · {receipt.omitidos} registros existentes omitidos.{receipt.repetida && " No se ha duplicado ningún registro."} Puedes consultar los datos en su módulo y continuar con tus operaciones.</p><div className={styles.actions}><Link className={styles.primary} href={kind === "productos" ? "/inventario" : "/clientes"}>Ver {kind === "productos" ? "inventario" : "clientes"}<ArrowRight size={16} aria-hidden="true" /></Link><button className={styles.secondary} onClick={reset}>Importar otro archivo</button></div></div></div></section>}

    {business && <section className={`${styles.panel} ${styles.history}`}><div className={styles.panelHead}><div><h2>Importaciones de este negocio</h2><p>Últimas 15 cargas confirmadas. Cada carga conserva su resultado.</p></div><History size={20} aria-hidden="true" /></div>{historyError ? <p className={styles.empty}>{historyError}</p> : history.length ? <div className={styles.scroll} tabIndex={0} aria-label="Historial de importaciones"><table className={styles.table}><thead><tr><th scope="col">Archivo</th><th scope="col">Tipo</th><th scope="col">Fecha · Lima</th><th scope="col">Creados</th><th scope="col">Omitidos</th></tr></thead><tbody>{history.map(item => <tr key={item.id_importacion}><td title={item.nombre_archivo}>{item.nombre_archivo}</td><td>{item.tipo}</td><td>{new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(item.created_at))}</td><td>{item.creados}</td><td>{item.omitidos}</td></tr>)}</tbody></table></div> : <p className={styles.empty}>Tu primera importación aparecerá aquí cuando la confirmes.</p>}</section>}
  </section>;
}

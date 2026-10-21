"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle, Plus, RotateCw, Trash2 } from "lucide-react";
import { configureCredit, paySupplier, registerClient, registerPayment, registerProduct, registerPurchase, registerSale, type OperationState } from "@/features/operations/actions";
import styles from "./operations.module.css";
import { SearchableOption } from "./searchable-option";
import { PRODUCT_LIMITS, PRODUCT_UNITS, CUSTOMER_LIMITS } from "@/features/operations/catalog-validation";
import { FormHelp } from "./form-help";
import { CreditPreview } from "./credit-preview";
import { ProductLookup } from "@/components/public-apis/product-lookup";

export type Option = { id: string; label: string };
export type FormOptions = { clients: Option[]; products: Option[]; installments: Option[]; payables: Option[]; today: string; key: string };
const initial: OperationState = { error: null, success: null };
function Submit({ success, sale, preview, label }: { success: boolean; sale: boolean; preview: boolean; label: string }) {
  const { pending } = useFormStatus();
  return <button className={styles.submit} type="submit" name="intent" value={sale&&preview?'confirm':'preview'} disabled={pending || success} aria-busy={pending}>{pending ? <LoaderCircle size={16} className={styles.loadingIcon} aria-hidden="true"/> : success ? <Check size={16} aria-hidden="true"/> : <ArrowRight size={16} aria-hidden="true"/>}{pending ? "Procesando…" : success ? "Operación registrada" : sale ? preview ? "Confirmar venta" : "Revisar venta y cronograma" : label}</button>;
}
export function OperationForm({ kind, options, isDemo, businessId }: { businessId:string; kind: "ventas" | "compras" | "pagos" | "clientes" | "inventario" | "creditos" | "cuentas-por-pagar"; options: FormOptions; isDemo: boolean }) {
  const action = kind === "ventas" ? registerSale : kind === "compras" ? registerPurchase : kind === "pagos" ? registerPayment : kind === "clientes" ? registerClient : kind === "inventario" ? registerProduct : kind === "creditos" ? configureCredit : paySupplier;
  const [state, formAction] = useActionState(action, initial);
  const [mode, setMode] = useState("CONTADO");
  const [itemCount, setItemCount] = useState(1);
  const [customer,setCustomer]=useState("");
  const [installments,setInstallments]=useState("2");
  const [grace,setGrace]=useState("0");
  const [products,setProducts]=useState<string[]>([]);
  const [quantities,setQuantities]=useState<string[]>([]);
  const [productDraft,setProductDraft]=useState({name:"",brand:"",category:"",description:""});
  return <section className={styles.formCard}>
    <div className={styles.formHeading}><h2>{kind === "ventas" ? "Registrar venta" : kind === "compras" ? "Registrar compra" : kind === "pagos" ? "Registrar cobro" : kind === "clientes" ? "Registrar cliente" : kind === "inventario" ? "Registrar producto" : kind === "creditos" ? "Configurar línea de crédito" : "Pagar a proveedor"}</h2><p>{isDemo ? "Esta operación modificará únicamente los datos del bazar DEMO seleccionado." : "Revisa los datos antes de registrar la operación."}</p></div>
    <form action={formAction} className={styles.form} onReset={event=>event.preventDefault()}>
      <div className={styles.formHint}><FormHelp title="Cómo registrar esta operación"><p>{kind === 'inventario' ? 'El SKU identifica el producto en tu negocio. Completa precios, unidad y modalidades de crédito. El stock inicial es cero: ingresa existencias mediante Compras o una importación con stock de apertura. Puedes agregar una fotografía desde la ficha del producto después de guardarlo.' : kind === 'clientes' ? 'Registra el documento sin espacios y conserva sus ceros iniciales. Correo, celular y dirección son opcionales. Debes contar con autorización del cliente. Crear esta ficha no genera deudas ni una cuenta de acceso: usa Invitaciones para habilitar su portal.' : kind === 'creditos' ? 'La línea limita el saldo financiable del cliente. Ingresa las tasas anuales como porcentaje (24 significa 24%). El pago debe estar al menos cinco días después del corte. Las condiciones se usan solo en nuevas ventas.' : kind === 'ventas' ? 'Elige contado, fin de mes o cuotas. El crédito requiere un cliente con línea disponible y sin mora. Primero revisa el importe y el cronograma; después confirma. El sistema comprueba las existencias y las condiciones nuevamente al guardar.' : kind === 'compras' ? 'Registra el costo de adquisición y la cantidad recibida. Al guardar se incrementa el inventario. Si compras a crédito, se crea una cuenta por pagar; si pagas al contado, se registra la salida de caja.' : 'Selecciona la obligación que vas a cancelar y verifica el saldo. El sistema impide pagar por encima de la deuda. Los cobros a clientes respetan la política de pagos parciales del bazar.'}</p></FormHelp></div>
      <input type="hidden" name="key" value={options.key} />
      {kind === "ventas" && <>
        <SearchableOption kind="clientes" label="Cliente" name="customer" initial={options.clients} value={customer} onChange={setCustomer} required={false} emptyLabel="Sin cliente (solo contado)"/>
        <label>Modalidad <select name="mode" value={mode} onChange={event => setMode(event.target.value)}><option value="CONTADO">Contado</option><option value="FIN_DE_MES">Crédito fin de mes</option><option value="EN_CUOTAS">Crédito en cuotas</option></select></label>
        {mode === "EN_CUOTAS" && <><label>Número de cuotas <input name="installments" type="number" min="2" max="12" value={installments} onChange={e=>setInstallments(e.target.value)} required /></label><label>Días de gracia <input name="grace" type="number" min="0" max="30" value={grace} onChange={e=>setGrace(e.target.value)} required /></label></>}
      </>}
      {kind === "compras" && <>
        <label>Proveedor <input name="supplier" type="text" maxLength={120} required placeholder="Nombre del proveedor" /></label>
        <label>Modalidad <select name="mode" value={mode} onChange={event => setMode(event.target.value)}><option value="CONTADO">Contado</option><option value="CREDITO">Crédito</option></select></label>
        <label>Fecha de vencimiento <input name="due" type="date" min={options.today} defaultValue={options.today} required /></label>
      </>}
      {(kind === "ventas" || kind === "compras") && <>
        {Array.from({ length: itemCount }, (_, index) => <div className={styles.itemRow} key={index}>
          <SearchableOption kind={kind==="compras"?"productos_compra":"productos"} label={`Producto ${index+1}`} name="product" initial={options.products} value={products[index]??""} onChange={id=>setProducts(values=>{const next=[...values];next[index]=id;return next;})}/>
          <label>Cantidad <input name="quantity" type="number" min="1" max="500" value={quantities[index]??'1'} onChange={e=>setQuantities(values=>{const next=[...values];next[index]=e.target.value;return next;})} required /></label>
          {kind === "compras" && <label>Costo unitario (S/) <input name="cost" type="number" min="0.01" max="100000" step="0.01" required /></label>}
        </div>)}
        {itemCount < 100 && <button type="button" className={styles.addItem} onClick={() => setItemCount(itemCount + 1)}><Plus size={16} aria-hidden="true"/>Agregar otro producto</button>}
        {itemCount > 1 && <button type="button" className={`${styles.addItem} ${styles.removeItem}`} onClick={() => {setProducts(products.slice(0,itemCount-1));setQuantities(quantities.slice(0,itemCount-1));setItemCount(itemCount-1);}}><Trash2 size={16} aria-hidden="true"/>Quitar último producto</button>}
      </>}
      {kind === "pagos" && <>
        <SearchableOption kind="cuotas" label="Cuota pendiente" name="installment" initial={options.installments}/>
        <label>Monto a cobrar (S/) <input name="amount" type="number" min="0.01" max="15000" step="0.01" required /></label>
        <label>Medio <select name="method" defaultValue="EFECTIVO"><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option><option value="YAPE">Yape</option><option value="PLIN">Plin</option></select></label>
        <p className={styles.formHint}>El saldo mostrado puede aumentar por mora hasta la fecha del cobro. El servidor valida el monto exacto.</p>
      </>}
      {kind === "cuentas-por-pagar" && <>
        <SearchableOption kind="proveedores" label="Compra pendiente" name="purchase" initial={options.payables}/>
        <label>Monto a pagar (S/) <input name="amount" type="number" min="0.01" step="0.01" required /></label>
        <p className={styles.formHint}>El pago puede ser parcial. El servidor impedirá superar el saldo de la compra.</p>
      </>}
      {kind === "clientes" && <>
        <label>Nombre completo <input name="name" type="text" minLength={3} maxLength={CUSTOMER_LIMITS.name} required /></label>
        <label>Tipo de documento <select name="document_type" defaultValue="DNI"><option value="DNI">DNI</option><option value="RUC">RUC</option></select></label>
        <label>Número de documento <input name="document" type="text" inputMode="numeric" maxLength={11} required /></label>
        <label>Correo (opcional) <input name="email" type="email" maxLength={CUSTOMER_LIMITS.email} /></label>
        <label>Celular (opcional) <input name="phone" type="tel" inputMode="numeric" maxLength={9} /></label>
        <label>Dirección (opcional) <input name="address" type="text" maxLength={CUSTOMER_LIMITS.address} /></label>
        <label className={styles.consent}><input name="consent" type="checkbox" value="yes" required />Confirmo que tengo autorización para registrar los datos de esta persona. Para la DEMO usaré datos ficticios.</label>
      </>}
      {kind === "inventario" && <>
        <ProductLookup businessId={businessId} onApply={p=>setProductDraft(old=>({name:p.name,brand:p.brand||old.brand,category:p.category||old.category,description:p.description||old.description}))}/>
        <label>Código SKU <input name="sku" type="text" minLength={2} maxLength={PRODUCT_LIMITS.sku} required /></label>
        <label>Producto <input name="name" value={productDraft.name} onChange={e=>setProductDraft({...productDraft,name:e.target.value})} type="text" minLength={2} maxLength={PRODUCT_LIMITS.name} required /></label>
        <label>Categoría <input name="category" value={productDraft.category} onChange={e=>setProductDraft({...productDraft,category:e.target.value})} type="text" minLength={2} maxLength={PRODUCT_LIMITS.category} required /></label>
        <label>Descripción (opcional)<input name="description" value={productDraft.description} onChange={e=>setProductDraft({...productDraft,description:e.target.value})} maxLength={PRODUCT_LIMITS.description}/></label>
        <label>Marca (opcional)<input name="brand" value={productDraft.brand} onChange={e=>setProductDraft({...productDraft,brand:e.target.value})} maxLength={PRODUCT_LIMITS.brand}/></label>
        <label>Proveedor habitual (opcional)<input name="supplier" maxLength={PRODUCT_LIMITS.supplier}/></label>
        <label>Unidad de medida<select name="unit" defaultValue="Unidad">{PRODUCT_UNITS.map(unit=><option key={unit}>{unit}</option>)}</select></label>
        <label>Precio contado (S/) <input name="cash_price" type="number" min="0.01" step="0.01" required /></label>
        <label>Precio crédito (S/) <input name="credit_price" type="number" min="0.01" step="0.01" required /></label>
        <label>Stock mínimo <input name="minimum" type="number" min="0" step="1" defaultValue="5" required /></label>
        <label className={styles.consent}><input name="fin_mes" type="checkbox" value="yes" defaultChecked/>Permitir crédito a fin de mes</label>
        <label className={styles.consent}><input name="installments" type="checkbox" value="yes" defaultChecked/>Permitir crédito en cuotas</label>
        <p className={styles.formHint}>Selecciona al menos una modalidad. El producto inicia con stock cero. Registra una compra para reponerlo. Agrega su fotografía desde la ficha del producto.</p>
      </>}
      {kind === "creditos" && <>
        <SearchableOption kind="sin_linea" label="Cliente sin línea" name="customer" initial={options.clients}/>
        <label>Línea máxima (S/) <input name="line" type="number" min="50" max="10000" step="0.01" defaultValue="300" required /></label>
        <label>Tasa compensatoria TEA (%) <input name="annual_rate" type="number" min="0.0001" max="150" step="0.0001" defaultValue="24" required /></label>
        <label>Tasa moratoria TEA (%) <input name="late_rate" type="number" min="0.0001" max="200" step="0.0001" defaultValue="36" required /></label>
        <label>Día de corte <input name="cut_day" type="number" min="1" max="25" defaultValue="20" required /></label>
        <label>Día de pago <input name="pay_day" type="number" min="6" max="30" defaultValue="26" required /></label>
        <label>Plazo máximo (meses) <input name="months" type="number" min="2" max="12" defaultValue="6" required /></label>
        <p className={styles.formHint}>Se usa TEA en porcentaje. El servidor convierte la tasa sin redondeos intermedios y exige al menos cinco días entre corte y pago.</p>
      </>}
      {kind==='ventas'&&state.preview&&<><CreditPreview plan={state.preview}/><p className={styles.formHint}>Revisa el detalle antes de confirmar. Si cambias los datos, vuelve a calcular el resumen.</p><button className={styles.addItem} name="intent" value="preview"><RotateCw size={16} aria-hidden="true"/>Actualizar previsualización</button></>}
      <div className={styles.formActions}><Submit success={Boolean(state.success)} sale={kind==='ventas'} preview={Boolean(state.preview)} label={kind==='compras'?'Registrar compra':kind==='pagos'?'Registrar cobro':kind==='clientes'?'Guardar cliente':kind==='inventario'?'Guardar producto':kind==='creditos'?'Guardar línea de crédito':'Registrar pago'} />{state.success && <a href={"/" + kind}>Registrar otra operación</a>}</div>
      {state.error && <p className={styles.formError} role="alert">{state.error}</p>}
      {state.success && <p className={styles.formSuccess} role="status">{state.success}</p>}
      {state.success && state.productId && <Link className={styles.addItem} href={`/inventario/${state.productId}`}>Abrir ficha y agregar fotografía <ArrowRight size={16} aria-hidden="true"/></Link>}
    </form>
  </section>;
}

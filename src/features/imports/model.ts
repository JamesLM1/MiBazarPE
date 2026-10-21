export type ImportKind = "productos" | "clientes";
export type Cell = string | number | boolean | null;
export type ImportSheet = { name: string; rows: Cell[][] };
export type ImportWorkbook = { sheets: ImportSheet[] };
export type ImportField = { key: string; label: string; required: boolean; hint?: string };
export type ValidationRow = { sourceRow: number; data: Record<string, string | number>; errors: string[]; changes: string[] };

const productFields: ImportField[] = [
  { key: "codigo_sku", label: "Código / SKU", required: true, hint: "De 2 a 20 caracteres; conserva ceros iniciales." },
  { key: "nombre", label: "Nombre del producto", required: true },
  { key: "categoria", label: "Categoría", required: false, hint: "Si está vacío: General." },
  { key: "precio_contado", label: "Precio al contado", required: true },
  { key: "precio_credito", label: "Precio al crédito", required: false, hint: "Si está vacío: el precio al contado." },
  { key: "stock_actual", label: "Stock inicial", required: false, hint: "Si está vacío: 0. Se registra como apertura de inventario." },
  { key: "stock_minimo", label: "Stock mínimo", required: false, hint: "Si está vacío: 5." },
  { key: "unidad_medida", label: "Unidad de medida", required: false, hint: "Unidad, Paquete, Docena, Caja o Set. Por defecto: Unidad." },
  { key: "marca", label: "Marca", required: false },
  { key: "descripcion", label: "Descripción", required: false },
  { key: "proveedor", label: "Proveedor", required: false },
];
const clientFields: ImportField[] = [
  { key: "nombre_completo", label: "Nombre completo", required: true },
  { key: "tipo_documento", label: "Tipo de documento", required: false, hint: "DNI o RUC. Si está vacío: DNI." },
  { key: "numero_documento", label: "Número de documento", required: true, hint: "8 dígitos para DNI o 11 para RUC; no se agregan ceros." },
  { key: "correo", label: "Correo electrónico", required: false },
  { key: "telefono", label: "Celular", required: false, hint: "9 dígitos, comienza en 9." },
  { key: "direccion", label: "Dirección", required: false },
];
const aliases: Record<string, string[]> = {
  codigo_sku: ["sku", "codigo", "codigo producto", "cod producto", "codigo sku", "id producto", "referencia", "product code", "item code"],
  nombre: ["producto", "nombre producto", "nombre del producto", "articulo", "product", "product name", "nombre"],
  categoria: ["categoria", "rubro", "category", "familia"],
  precio_contado: ["precio contado", "precio al contado", "precio venta", "precio de venta", "precio", "pvp", "price", "sale price"],
  precio_credito: ["precio credito", "precio al credito", "credit price"],
  stock_actual: ["stock", "stock actual", "stock inicial", "existencias", "cantidad", "inventory", "quantity"],
  stock_minimo: ["stock minimo", "minimo", "minimum stock", "punto reposicion"],
  unidad_medida: ["unidad", "unidad medida", "unidad de medida", "presentacion", "unit"],
  marca: ["marca", "brand"], descripcion: ["descripcion", "description", "detalle"], proveedor: ["proveedor", "supplier"],
  nombre_completo: ["nombre completo", "nombres y apellidos", "nombre cliente", "cliente", "razon social", "customer name", "full name", "nombre"],
  tipo_documento: ["tipo documento", "tipo de documento", "tipo doc", "document type"],
  numero_documento: ["numero documento", "numero de documento", "nro documento", "nro doc", "documento", "dni", "ruc", "dni ruc", "document number"],
  correo: ["correo", "correo electronico", "email", "e mail", "mail"],
  telefono: ["telefono", "celular", "movil", "phone", "whatsapp"], direccion: ["direccion", "domicilio", "address"],
};
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function fieldsFor(kind: ImportKind): ImportField[] { return kind === "productos" ? productFields : clientFields; }
export function suggestMapping(headers: string[], kind: ImportKind): Record<string, number> {
  const cleanHeaders = headers.map(normalized);
  const used = new Set<number>();
  return Object.fromEntries(fieldsFor(kind).map(field => {
    const accepted = [normalized(field.key), ...(aliases[field.key] ?? [])];
    const index = cleanHeaders.findIndex((header, i) => !used.has(i) && accepted.includes(header));
    if (index >= 0) used.add(index);
    return [field.key, index];
  }));
}
export function guessKind(headers: string[]): ImportKind {
  const clients = suggestMapping(headers, "clientes");
  const products = suggestMapping(headers, "productos");
  return clients.numero_documento >= 0 && products.codigo_sku < 0 ? "clientes" : "productos";
}

function decimalValue(raw: Cell | undefined, format: "punto" | "coma"): string | null {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null;
    // Numeric spreadsheet cells already carry an unambiguous number. Locale applies to text cells only.
    const value = String(raw);
    return /^\d+(?:\.\d{1,2})?$/.test(value) ? Number(raw).toFixed(2) : null;
  }
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/^(?:S\/\s*|PEN\s+)/i, "");
  const pattern = format === "punto" ? /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/ : /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/;
  if (!pattern.test(value)) return null;
  const canonical = format === "punto" ? value.replace(/,/g, "") : value.replace(/\./g, "").replace(",", ".");
  const number = Number(canonical);
  return Number.isFinite(number) ? number.toFixed(2) : null;
}

export function validateRows(rows: Cell[][], mapping: Record<string, number>, kind: ImportKind, decimal: "punto" | "coma", startRow: number): ValidationRow[] {
  const required = fieldsFor(kind).filter(field => field.required && !(Number.isInteger(mapping[field.key]) && mapping[field.key] >= 0 && mapping[field.key] < 64));
  const result: ValidationRow[] = [];
  rows.forEach((row, rowIndex) => {
    if (row.every(cell => cell === null || cell === undefined || (typeof cell === "string" && !cell.trim()))) return;
    const item: ValidationRow = { sourceRow: startRow + rowIndex, data: {}, errors: required.map(field => `Falta asignar la columna «${field.label}».`), changes: [] };
    const get = (key: string): Cell | undefined => Number.isInteger(mapping[key]) && mapping[key] >= 0 && mapping[key] < 64 ? row[mapping[key]] : undefined;
    const read = (key: string, label: string, max: number, min = 0, fallback = "") => {
      const raw = get(key);
      if (typeof raw === "boolean") item.errors.push(`${label}: usa texto, no un valor lógico.`);
      const original = raw == null ? "" : String(raw);
      const value = original.trim().replace(/\s+/g, " ") || fallback;
      if (original !== value) item.changes.push(`${label}: ${original.trim() ? "espacios normalizados" : `valor predeterminado «${fallback}»`}.`);
      if (value.length < min || value.length > max) item.errors.push(`${label}: debe tener ${min ? `entre ${min} y` : "como máximo"} ${max} caracteres.`);
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) item.errors.push(`${label}: contiene caracteres de control.`);
      item.data[key] = value;
      return value;
    };
    if (kind === "productos") {
      read("codigo_sku", "Código / SKU", 20, 2);
      read("nombre", "Nombre", 100, 2);
      read("categoria", "Categoría", 50, 1, "General");
      read("marca", "Marca", 80); read("descripcion", "Descripción", 250); read("proveedor", "Proveedor", 120);
      const unit = read("unidad_medida", "Unidad", 20, 1, "Unidad");
      const canonicalUnit = ["Unidad", "Paquete", "Docena", "Caja", "Set"].find(value => normalized(value) === normalized(unit));
      if (!canonicalUnit) item.errors.push("Unidad: elige Unidad, Paquete, Docena, Caja o Set.");
      else { item.data.unidad_medida = canonicalUnit; if (unit !== canonicalUnit) item.changes.push("Unidad: nombre normalizado."); }
      for (const key of ["precio_contado", "precio_credito"]) {
        const raw = get(key);
        const fallback = key === "precio_credito" && (raw == null || raw === "");
        const value = fallback ? String(item.data.precio_contado ?? "") : decimalValue(raw, decimal);
        const label = key === "precio_contado" ? "Precio al contado" : "Precio al crédito";
        if (!value || Number(value) <= 0 || Number(value) > 100000) item.errors.push(`${label}: usa un importe mayor que 0 y hasta 100000, con máximo 2 decimales y el separador seleccionado.`);
        item.data[key] = value ?? "";
        if (fallback) item.changes.push("Precio al crédito: se usará el precio al contado.");
        else if (value && String(raw) !== value) item.changes.push(`${label}: formato normalizado a ${value}.`);
      }
      if (Number(item.data.precio_credito) < Number(item.data.precio_contado)) item.errors.push("El precio al crédito no puede ser menor que el precio al contado.");
      for (const key of ["stock_actual", "stock_minimo"]) {
        const raw = get(key);
        const fallback = raw == null || raw === "";
        const text = fallback ? key === "stock_actual" ? "0" : "5" : String(raw).trim();
        const value = Number(text);
        if (!/^\d+$/.test(text) || !Number.isInteger(value) || value < 0 || value > 100000) item.errors.push(`${key === "stock_actual" ? "Stock inicial" : "Stock mínimo"}: usa un entero de 0 a 100000.`);
        item.data[key] = Number.isInteger(value) && value >= 0 && value <= 100000 ? value : 0;
        if (fallback) item.changes.push(`${key === "stock_actual" ? "Stock inicial" : "Stock mínimo"}: valor predeterminado ${text}.`);
      }
    } else {
      read("nombre_completo", "Nombre completo", 100, 3);
      const originalType = read("tipo_documento", "Tipo de documento", 3, 3, "DNI");
      const type = originalType.toUpperCase(); item.data.tipo_documento = type;
      if (type !== originalType) item.changes.push("Tipo de documento: normalizado a mayúsculas.");
      const document = read("numero_documento", "Número de documento", 11, 8);
      if (!((type === "DNI" && /^\d{8}$/.test(document)) || (type === "RUC" && /^\d{11}$/.test(document)))) item.errors.push("Documento: DNI requiere 8 dígitos y RUC 11; no agregamos ni quitamos dígitos.");
      const originalEmail = read("correo", "Correo", 120);
      const email = originalEmail.toLowerCase(); item.data.correo = email;
      if (email !== originalEmail) item.changes.push("Correo: normalizado a minúsculas.");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) item.errors.push("Correo: revisa el formato de la dirección.");
      const phone = read("telefono", "Celular", 15);
      if (phone && !/^9\d{8}$/.test(phone)) item.errors.push("Celular: usa 9 dígitos, comenzando en 9, sin prefijo de país.");
      read("direccion", "Dirección", 250);
    }
    result.push(item);
  });
  const key = kind === "productos" ? "codigo_sku" : "numero_documento";
  const groups = new Map<string, ValidationRow[]>();
  for (const row of result) { const value = String(row.data[key]); if (value) groups.set(value, [...(groups.get(value) ?? []), row]); }
  for (const rows of groups.values()) if (rows.length > 1) for (const row of rows) row.errors.push(`${kind === "productos" ? "Código / SKU" : "Documento"} repetido dentro del archivo (filas ${rows.map(item => item.sourceRow).join(", ")}).`);
  if (result.length > 500) for (const row of result) row.errors.push("El límite es 500 registros por importación; divide el archivo.");
  return result;
}

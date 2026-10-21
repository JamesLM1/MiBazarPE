import * as XLSX from "xlsx";
import type { Cell, ImportSheet, ImportWorkbook } from "./model";

export const IMPORT_LIMITS = { bytes: 2 * 1024 * 1024, rows: 520, columns: 64, sheets: 10, expandedBytes: 20 * 1024 * 1024 };
const invalid = (message: string): never => { throw new Error(message); };
const extensionOf = (name: string) => name.toLowerCase().split(".").pop() ?? "";
const blank = (value: Cell) => value === null || (typeof value === "string" && value.trim() === "");

function validateShape(sheet: ImportSheet): ImportSheet {
  if (sheet.rows.length > IMPORT_LIMITS.rows) invalid(`La hoja «${sheet.name}» supera 520 filas. Usa hasta 500 registros y como máximo 20 filas de encabezados.`);
  for (const row of sheet.rows) {
    if (row.length > IMPORT_LIMITS.columns) invalid(`La hoja «${sheet.name}» supera 64 columnas. Conserva las columnas necesarias.`);
    if (row.some(cell => typeof cell === "string" && cell.length > 10000)) invalid("Una celda supera 10000 caracteres. Reduce el contenido antes de importar.");
    if (row.some(cell => typeof cell === "number" && !Number.isFinite(cell))) invalid("El archivo contiene un número no válido.");
  }
  while (sheet.rows.length && sheet.rows[sheet.rows.length - 1].every(blank)) sheet.rows.pop();
  return sheet;
}

// Inspect archive boundaries before SheetJS expands spreadsheets. Nothing is written to disk.
function validateZip(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  let end = -1;
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === view.byteLength) { end = i; break; }
  }
  if (end < 0) invalid("El archivo de hoja de cálculo está incompleto o dañado.");
  const count = view.getUint16(end + 10, true);
  const centralSize = view.getUint32(end + 12, true);
  let position = view.getUint32(end + 16, true);
  const centralEnd = position + centralSize;
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || count !== view.getUint16(end + 8, true) || count > 300 || count === 65535 || centralEnd !== end) invalid("Este libro usa un archivo dividido, ZIP64 o demasiados componentes. Guarda una copia sencilla sin imágenes ni macros.");
  let expanded = 0;
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (position + 46 > centralEnd || view.getUint32(position, true) !== 0x02014b50) invalid("La estructura del libro no es válida.");
    const flags = view.getUint16(position + 8, true);
    const method = view.getUint16(position + 10, true);
    const compressed = view.getUint32(position + 20, true);
    const length = view.getUint32(position + 24, true);
    const nameLength = view.getUint16(position + 28, true);
    const extra = view.getUint16(position + 30, true);
    const comment = view.getUint16(position + 32, true);
    const offset = view.getUint32(position + 42, true);
    const next = position + 46 + nameLength + extra + comment;
    if (next > centralEnd || offset + 30 > view.byteLength || view.getUint32(offset, true) !== 0x04034b50) invalid("La estructura interna del libro está dañada.");
    if ((flags & 1) || (view.getUint16(offset + 6, true) & 1)) invalid("El archivo tiene contraseña. Exporta una copia sin protección para importar.");
    if (method !== 0 && method !== 8) invalid("El libro usa una compresión no compatible. Guarda una copia XLSX u ODS.");
    if (offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true) + compressed > position) invalid("Los límites internos del archivo no son válidos.");
    expanded += length;
    if (expanded > IMPORT_LIMITS.expandedBytes || length === 0xffffffff) invalid("El libro supera 20 MB al descomprimirse. Retira imágenes y hojas innecesarias.");
    const name = decoder.decode(new Uint8Array(buffer, position + 46, nameLength));
    if (/vbaProject\.bin$/i.test(name) || /(?:^|\/)macros\//i.test(name)) invalid("Este libro contiene macros. Guarda una copia de los datos sin macros.");
    position = next;
  }
  if (position !== centralEnd) invalid("La estructura del libro no es válida.");
}

// Count actual inflated bytes in bounded chunks; archive metadata alone is not trusted.
export async function verifyWorkbookArchive(buffer: ArrayBuffer, fileName: string): Promise<void> {
  if (buffer.byteLength > IMPORT_LIMITS.bytes) invalid("El límite es 2 MB por archivo.");
  if (!["xlsx", "ods"].includes(extensionOf(fileName))) return;
  validateZip(buffer);
  const view = new DataView(buffer);
  let end = view.byteLength - 22;
  while (end >= 0 && !(view.getUint32(end, true) === 0x06054b50 && end + 22 + view.getUint16(end + 20, true) === view.byteLength)) end--;
  let position = view.getUint32(end + 16, true);
  const count = view.getUint16(end + 10, true);
  let total = 0;
  for (let i = 0; i < count; i++) {
    const method = view.getUint16(position + 10, true);
    const compressed = view.getUint32(position + 20, true);
    const expected = view.getUint32(position + 24, true);
    const offset = view.getUint32(position + 42, true);
    if (method !== view.getUint16(offset + 8, true)) invalid("El libro contiene metadatos de compresión inconsistentes.");
    const start = offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true);
    let actual = 0;
    if (method === 0) { actual = compressed; total += actual; }
    else {
      const reader = new Blob([buffer.slice(start, start + compressed)]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          actual += chunk.value.byteLength; total += chunk.value.byteLength;
          if (actual > expected || total > IMPORT_LIMITS.expandedBytes) { await reader.cancel(); invalid("El tamaño real del libro no coincide con sus metadatos o supera 20 MB. Exporta una copia nueva."); }
        }
      } finally { reader.releaseLock(); }
    }
    if (actual !== expected || total > IMPORT_LIMITS.expandedBytes) invalid("El tamaño real del libro no coincide con sus metadatos o supera 20 MB. Exporta una copia nueva.");
    position += 46 + view.getUint16(position + 28, true) + view.getUint16(position + 30, true) + view.getUint16(position + 32, true);
  }
}

function textFrom(buffer: ArrayBuffer): string {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^\uFEFF/, ""); }
  catch { return invalid("El texto no está en UTF-8. En Excel, usa «CSV UTF-8»; también puedes cargar el archivo XLSX original."); }
}

function parseDelimited(text: string, separator: string): Cell[][] {
  const rows: Cell[][] = [];
  let row: string[] = [], value = "", quoted = false, closed = false;
  const cell = () => {
    row.push(value); value = ""; closed = false;
    if (row.length > IMPORT_LIMITS.columns) invalid("El archivo supera 64 columnas.");
  };
  const line = () => {
    cell(); rows.push(row); row = [];
    if (rows.length > IMPORT_LIMITS.rows) invalid("El archivo supera 520 filas. Divide los datos en grupos de hasta 500 registros.");
  };
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (quoted) {
      if (character === '"') { if (text[i + 1] === '"') { value += '"'; i++; } else { quoted = false; closed = true; } }
      else value += character;
    } else if (character === separator) cell();
    else if (character === "\n" || character === "\r") { if (character === "\r" && text[i + 1] === "\n") i++; line(); }
    else if (character === '"' && !value && !closed) quoted = true;
    else if (closed || character === '"') invalid("Las comillas del archivo no están bien cerradas. Guarda una nueva copia CSV o XLSX.");
    else value += character;
    if (value.length > 10000) invalid("Una celda supera 10000 caracteres.");
  }
  if (quoted) invalid("El archivo termina dentro de una celda entre comillas.");
  if (value || row.length || closed) line();
  return rows;
}

function delimiterFor(text: string): string {
  let quoted = false;
  const counts = new Map([[",", 0], [";", 0], ["\t", 0], ["|", 0]]);
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === '"') { if (quoted && text[i + 1] === '"') i++; else quoted = !quoted; }
    else if (!quoted && (character === "\n" || character === "\r")) { if ([...counts.values()].some(Boolean)) break; }
    else if (!quoted && counts.has(character)) counts.set(character, counts.get(character)! + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

function jsonSheet(name: string, input: unknown): ImportSheet {
  if (!Array.isArray(input)) invalid("JSON: cada hoja debe ser una lista de objetos con columnas y valores.");
  const items = input as unknown[];
  if (items.length > 500) invalid("JSON: el límite es 500 registros por hoja.");
  const headers: string[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) invalid("JSON: usa una lista de objetos planos; no se admiten listas o valores sueltos como filas.");
    for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) invalid("JSON: contiene una clave reservada.");
      if (!key.trim() || key.length > 100) invalid("JSON: los nombres de columna deben tener entre 1 y 100 caracteres.");
      if (value !== null && !["string", "number", "boolean"].includes(typeof value)) invalid("JSON: las columnas deben contener texto, números, verdadero/falso o null; aplana los objetos anidados.");
      if (!headers.includes(key)) headers.push(key);
      if (headers.length > IMPORT_LIMITS.columns) invalid("JSON: el límite es 64 columnas por hoja.");
    }
  }
  return validateShape({ name, rows: [headers, ...items.map(item => headers.map(key => Object.hasOwn(item as object, key) ? (item as Record<string, Cell>)[key] : null))] });
}

export function parseWorkbook(buffer: ArrayBuffer, fileName: string): ImportWorkbook {
  if (!buffer.byteLength) invalid("El archivo está vacío.");
  if (buffer.byteLength > IMPORT_LIMITS.bytes) invalid("El límite es 2 MB por archivo. Divide los datos o elimina hojas e imágenes innecesarias.");
  const extension = extensionOf(fileName);
  if (!["xlsx", "xls", "ods", "csv", "tsv", "txt", "json"].includes(extension)) invalid("Formato no compatible. Usa XLSX, XLS, ODS, CSV, TSV, TXT delimitado o JSON. PDF e imágenes necesitan transcripción previa.");
  let sheets: ImportSheet[];
  if (extension === "json") {
    let data: unknown;
    try { data = JSON.parse(textFrom(buffer)); } catch (error) { if (error instanceof SyntaxError) invalid("El JSON no es válido. Revisa sus comillas, comas y corchetes."); throw error; }
    if (Array.isArray(data)) sheets = [jsonSheet("Datos", data)];
    else if (data && typeof data === "object") {
      const entries = Object.entries(data);
      if (entries.length > IMPORT_LIMITS.sheets) invalid("El límite es 10 hojas por archivo.");
      sheets = entries.map(([name, rows]) => { if (["__proto__", "prototype", "constructor"].includes(name)) invalid("JSON: contiene una clave reservada."); return jsonSheet(name.slice(0, 100), rows); });
    } else return invalid("JSON: usa una lista de objetos o un objeto que contenga listas por hoja.");
  } else if (["csv", "tsv", "txt"].includes(extension)) {
    const text = textFrom(buffer);
    if (text.includes("\u0000")) invalid("Este archivo no es texto delimitado. Usa el formato original XLSX o CSV UTF-8.");
    sheets = [validateShape({ name: "Datos", rows: parseDelimited(text, extension === "tsv" ? "\t" : delimiterFor(text)) })];
  } else {
    const bytes = new Uint8Array(buffer);
    if (extension === "xls") {
      if (![0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((byte, index) => bytes[index] === byte)) invalid("El contenido no corresponde a un libro XLS. Guarda una copia XLSX o CSV UTF-8.");
    } else {
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) invalid("El contenido no corresponde a un libro XLSX u ODS.");
      validateZip(buffer);
    }
    let book: XLSX.WorkBook;
    try { book = XLSX.read(buffer, { type: "array", raw: true, cellFormula: true, cellHTML: false, cellStyles: false, bookVBA: false, sheetRows: IMPORT_LIMITS.rows + 1 }); }
    catch { return invalid("No se pudo leer el libro. Comprueba que no tenga contraseña y guarda una copia XLSX, ODS o CSV UTF-8."); }
    if (book.SheetNames.length > IMPORT_LIMITS.sheets) invalid("El límite es 10 hojas por archivo. Carga una copia con las hojas necesarias.");
    sheets = book.SheetNames.map(name => {
      const sheet = book.Sheets[name];
      const range = XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"] || "A1");
      if (range.e.r >= IMPORT_LIMITS.rows || range.e.c >= IMPORT_LIMITS.columns) invalid(`La hoja «${name}» supera 520 filas o 64 columnas. Elimina filas o columnas sobrantes y sus formatos.`);
      const rows: Cell[][] = [];
      for (let r = 0; r <= range.e.r; r++) {
        const row: Cell[] = [];
        for (let c = 0; c <= range.e.c; c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r, c })];
          if (cell?.f || cell?.F) invalid(`La hoja «${name}», celda ${XLSX.utils.encode_cell({ r, c })}, contiene una fórmula. Copia los resultados y pégalos como valores antes de importar.`);
          if (cell?.t === "e") invalid(`La hoja «${name}» contiene un error en ${XLSX.utils.encode_cell({ r, c })}. Corrígelo antes de importar.`);
          if (cell?.t === "d") invalid("Convierte las fechas a texto antes de importar productos o clientes.");
          row.push(cell?.v == null ? null : typeof cell.v === "number" || typeof cell.v === "boolean" ? cell.v : String(cell.v));
        }
        rows.push(row);
      }
      return validateShape({ name, rows });
    });
  }
  sheets = sheets.filter(sheet => sheet.rows.some(row => row.some(cell => !blank(cell))));
  if (!sheets.length) invalid("No se encontraron datos. Añade una fila de encabezados y al menos un registro.");
  return { sheets };
}

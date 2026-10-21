import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { fieldsFor, suggestMapping, guessKind, validateRows } from "../src/features/imports/model.ts";
import { parseWorkbook, verifyWorkbookArchive, IMPORT_LIMITS } from "../src/features/imports/parser.ts";

const utf8 = text => new TextEncoder().encode(text).buffer;
test("actual ZIP expansion is checked before spreadsheet parsing", async () => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Nombre"], ["Agenda"]]), "Datos");
  const original = XLSX.write(book, { type: "array", bookType: "xlsx", compression: true });
  await verifyWorkbookArchive(original, "catalogo.xlsx");
  const altered = original.slice(0); const view = new DataView(altered);
  for (let i = 0; i <= altered.byteLength - 46; i++) {
    if (view.getUint32(i, true) === 0x02014b50 && view.getUint32(i + 24, true) > 1) { view.setUint32(i + 24, 1, true); break; }
  }
  await assert.rejects(verifyWorkbookArchive(altered, "catalogo.xlsx"), /tamaño real/);
});
const products = ["SKU", "Producto", "Precio", "Stock"];
const clients = ["Nombres y apellidos", "DNI", "Correo", "Celular"];
const review = (rows, kind = "productos", decimal = "punto", headers = products) => validateRows(rows, suggestMapping(headers, kind), kind, decimal, 2);
function workbook(rows, bookType = "xlsx") {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Datos");
  return XLSX.write(book, { type: "array", bookType });
}

test("mapping recognizes accented Spanish and common aliases without reusing columns", () => {
  assert.equal(suggestMapping([" CÓDIGO ", "NOMBRE DEL PRODUCTO", "Categoría", "precio de venta"], "productos").codigo_sku, 0);
  assert.equal(suggestMapping(["NOMBRE DEL PRODUCTO"], "productos").precio_contado, -1);
  assert.equal(guessKind(clients), "clientes");
  assert.equal(guessKind(products), "productos");
  assert.equal(fieldsFor("productos").filter(field => field.required).length, 3);
});
test("CSV retains leading zero identifiers and handles quoted separators, newlines and escaped quotes", () => {
  const parsed = parseWorkbook(utf8('SKU,Producto,Precio,Stock\r\n0012,"Cuaderno, azul",12.50,5\r\n0013,"Papel ""A4""\nblanco",5,2\r\n'), "catalogo.csv");
  assert.deepEqual(parsed.sheets[0].rows[1], ["0012", "Cuaderno, azul", "12.50", "5"]);
  assert.equal(parsed.sheets[0].rows[2][1], 'Papel "A4"\nblanco');
  assert.equal(review(parsed.sheets[0].rows.slice(1))[0].data.codigo_sku, "0012");
});
test("semicolon comma-decimal CSV and tab text import without guessing monetary locale", () => {
  const parsed = parseWorkbook(utf8("SKU;Producto;Precio;Stock\nAB;Agenda;1.234,50;8"), "catalogo.csv");
  assert.equal(review(parsed.sheets[0].rows.slice(1), "productos", "coma")[0].data.precio_contado, "1234.50");
  assert.ok(review(parsed.sheets[0].rows.slice(1), "productos", "punto")[0].errors.length);
  assert.deepEqual(parseWorkbook(utf8("SKU\tProducto\nAB\tAgenda"), "archivo.txt").sheets[0].rows[1], ["AB", "Agenda"]);
  assert.throws(() => parseWorkbook(utf8('SKU,Producto\nAB,"Sin cierre'), "catalogo.csv"), /comillas/);
});
test("decimal precision and locale ambiguity are rejected instead of rounded or guessed", () => {
  assert.ok(review([["AB", "Agenda", "12.345", "1"]])[0].errors.some(error => error.includes("2 decimales")));
  assert.ok(review([["AB", "Agenda", "1,23", "1"]])[0].errors.length);
  assert.ok(review([["AB", "Agenda", "1,234.56", "1"]], "productos", "coma")[0].errors.length);
  assert.equal(review([["AB", "Agenda", 12.5, 1]], "productos", "coma")[0].data.precio_contado, "12.50");
  assert.equal(review([["AB", "Agenda", "S/ 12.50", "1"]])[0].data.precio_contado, "12.50");
  assert.ok(review([["AB", "Agenda", "100000.01", "1"]])[0].errors.length);
});
test("normalized preview exposes defaults and whitespace cleanup; invalid stock never passes", () => {
  const row = review([[" AB ", "  Agenda   azul ", "12", ""]])[0];
  assert.equal(row.errors.length, 0);
  assert.equal(row.data.nombre, "Agenda azul");
  assert.equal(row.data.precio_credito, "12.00");
  assert.equal(row.data.stock_actual, 0);
  assert.equal(row.data.stock_minimo, 5);
  assert.ok(row.changes.some(change => change.includes("espacios normalizados")));
  assert.ok(review([["AB", "Agenda", "12", "-1"]])[0].errors.some(error => error.includes("Stock")));
  assert.ok(review([["AB", "Agenda", "12", "1.5"]])[0].errors.some(error => error.includes("Stock")));
  assert.ok(review([["A", "X", "12", "1"]])[0].errors.length >= 2);
});
test("duplicate identifiers invalidate every affected row with accurate source row numbers", () => {
  const result = review([["AB", "Agenda", "12", "1"], [null, null, null, null], [" AB ", "Agenda 2", "12", "1"]]);
  assert.deepEqual(result.map(row => row.sourceRow), [2, 4]);
  assert.ok(result.every(row => row.errors.some(error => error.includes("filas 2, 4"))));
  assert.ok(review([["AB", "Agenda", "12", "1"]], "productos", "punto", ["SKU", "Producto"])[0].errors.some(error => error.includes("Falta asignar")));
});
test("customer identifiers keep zeros, reject guessed padding and validate contact fields", () => {
  const valid = review([["  Ana   Torres ", "01234567", "ANA@EXAMPLE.TEST", "912345678"]], "clientes", "punto", clients)[0];
  assert.equal(valid.errors.length, 0);
  assert.equal(valid.data.numero_documento, "01234567");
  assert.equal(valid.data.correo, "ana@example.test");
  assert.equal(valid.data.nombre_completo, "Ana Torres");
  const invalid = review([["Ana Torres", 1234567, "sin-correo", "+51912345678"]], "clientes", "punto", clients)[0];
  assert.ok(invalid.errors.some(error => error.includes("Documento")));
  assert.ok(invalid.errors.some(error => error.includes("Correo")));
  assert.ok(invalid.errors.some(error => error.includes("Celular")));
});
test("JSON accepts flat object arrays and named sheets while rejecting nested data and reserved keys", () => {
  const parsed = parseWorkbook(utf8(JSON.stringify({ Productos: [{ SKU: "001", Nombre: "Agenda", Precio: 12 }], Clientes: [{ DNI: "01234567", Nombre: "Ana Torres" }] })), "datos.json");
  assert.equal(parsed.sheets.length, 2);
  assert.equal(parsed.sheets[0].rows[1][0], "001");
  assert.throws(() => parseWorkbook(utf8('[{"producto":{"nombre":"Agenda"}}]'), "datos.json"), /anidados/);
  assert.throws(() => parseWorkbook(utf8('[{"__proto__":"x"}]'), "datos.json"), /reservada/);
  assert.throws(() => parseWorkbook(utf8("{bad"), "datos.json"), /JSON no es válido/);
});
test("XLSX, XLS and ODS parse real spreadsheet data preserving text identifiers", () => {
  for (const type of ["xlsx", "xls", "ods"]) {
    const parsed = parseWorkbook(workbook([products, ["0012", "Agenda", 12.5, 2]], type), `catalogo.${type}`);
    assert.equal(parsed.sheets[0].rows[1][0], "0012", type);
    assert.equal(parsed.sheets[0].rows[1][2], 12.5, type);
  }
});
test("formula cells are rejected even when a cached result is present", () => {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([products, ["0012", "Agenda", 12, 2]]);
  sheet.C2 = { t: "n", v: 12, f: "6+6" };
  XLSX.utils.book_append_sheet(book, sheet, "Datos");
  assert.throws(() => parseWorkbook(XLSX.write(book, { type: "array", bookType: "xlsx" }), "catalogo.xlsx"), /C2.*fórmula/);
});
test("limits reject oversized input and sheet dimensions without silently dropping records", () => {
  assert.throws(() => parseWorkbook(new ArrayBuffer(IMPORT_LIMITS.bytes + 1), "catalogo.csv"), /2 MB/);
  assert.throws(() => parseWorkbook(utf8(Array.from({ length: 521 }, () => "AB,Agenda").join("\n")), "catalogo.csv"), /520 filas/);
  assert.throws(() => parseWorkbook(utf8(Array.from({ length: 65 }, (_, i) => `Col${i}`).join(",")), "catalogo.csv"), /64 columnas/);
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([["Nombre"]]); sheet["!ref"] = "A1:A1000";
  XLSX.utils.book_append_sheet(book, sheet, "Datos");
  assert.throws(() => parseWorkbook(XLSX.write(book, { type: "array", bookType: "xlsx" }), "catalogo.xlsx"), /520 filas/);
  assert.throws(() => parseWorkbook(utf8(JSON.stringify(Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`Hoja${i}`, [{ a: 1 }]])))), "datos.json"), /10 hojas/);
});
test("format spoofing, binary text and non-UTF8 files produce actionable errors", () => {
  assert.throws(() => parseWorkbook(utf8("sku,producto\nAB,Agenda"), "catalogo.xlsx"), /no corresponde/);
  assert.throws(() => parseWorkbook(utf8("PDF content"), "catalogo.pdf"), /Formato no compatible/);
  assert.throws(() => parseWorkbook(new Uint8Array([0xff, 0xfe, 0xff]).buffer, "catalogo.csv"), /UTF-8/);
  assert.throws(() => parseWorkbook(utf8("ABC\u0000DEF"), "catalogo.csv"), /no es texto/);
  assert.throws(() => parseWorkbook(new ArrayBuffer(0), "catalogo.csv"), /vacío/);
});
test("zip metadata guards reject encrypted and oversized expanded workbooks before parsing", () => {
  const original = workbook([products, ["0012", "Agenda", 12.5, 2]]);
  const changed = original.slice(0); const view = new DataView(changed);
  let central = -1;
  for (let i = 0; i <= changed.byteLength - 46; i++) if (view.getUint32(i, true) === 0x02014b50) { central = i; break; }
  assert.ok(central >= 0);
  view.setUint32(central + 24, IMPORT_LIMITS.expandedBytes + 1, true);
  assert.throws(() => parseWorkbook(changed, "catalogo.xlsx"), /20 MB/);
  const encrypted = original.slice(0); new DataView(encrypted).setUint16(central + 8, 1, true);
  assert.throws(() => parseWorkbook(encrypted, "catalogo.xlsx"), /contraseña/);
});

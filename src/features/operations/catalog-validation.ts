// Shared limits mirror the live catalog schema. Validate again on the server.
export const PRODUCT_LIMITS = { sku: 20, name: 100, description: 250, brand: 80, category: 50, supplier: 120 } as const;
export const CUSTOMER_LIMITS = { name: 100, email: 120, address: 250 } as const;
export const PRODUCT_UNITS = ["Unidad", "Paquete", "Docena", "Caja", "Set"] as const;
const clean = (form: FormData, key: string) => typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";
const safeText = (value: string, min: number, max: number) => value.length >= min && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);

export function moneyInput(value: string, max = 100000): string | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) > max) return null;
  return value;
}

export function productFields(form: FormData, editing = false) {
  const name = clean(form, "name"), category = clean(form, "category");
  const description = clean(form, "description"), brand = clean(form, "brand"), supplier = clean(form, "supplier");
  const unit = clean(form, "unit"), sku = clean(form, "sku"), minimum = clean(form, "minimum");
  const cash = moneyInput(clean(form, editing ? "cash" : "cash_price"));
  const credit = moneyInput(clean(form, editing ? "credit" : "credit_price"));
  const finMes = form.get("fin_mes") === "yes", installments = form.get("installments") === "yes";
  if (!editing && !safeText(sku, 2, PRODUCT_LIMITS.sku)) return { error: "El SKU debe tener entre 2 y 20 caracteres." };
  if (!safeText(name, 2, PRODUCT_LIMITS.name) || !safeText(category, 2, PRODUCT_LIMITS.category)) return { error: "Usa un nombre de 2 a 100 caracteres y una categoría de 2 a 50." };
  if (!safeText(description, 0, PRODUCT_LIMITS.description) || !safeText(brand, 0, PRODUCT_LIMITS.brand) || !safeText(supplier, 0, PRODUCT_LIMITS.supplier)) return { error: "Revisa descripción (250 caracteres), marca (80) y proveedor (120)." };
  if (!PRODUCT_UNITS.some(value => value === unit)) return { error: "Selecciona una unidad de medida válida." };
  if (!cash || !credit || Number(credit) < Number(cash)) return { error: "Los precios deben ser positivos, de hasta S/ 100000 y tener como máximo dos decimales. El crédito no puede ser menor al contado." };
  if (!/^\d+$/.test(minimum) || Number(minimum) > 100000) return { error: "El stock mínimo debe ser un entero entre 0 y 100000." };
  if (!finMes && !installments) return { error: "Selecciona al menos una modalidad de crédito para este producto." };
  return { data: { nombre: name, categoria: category, descripcion: description || null, marca: brand || null, proveedor: supplier || null, unidad_medida: unit, precio_contado: cash, precio_credito: credit, stock_minimo: Number(minimum), permite_fin_mes: finMes, permite_cuotas: installments }, sku };
}

export function customerFields(form: FormData) {
  const name = clean(form, "name"), email = clean(form, "email").toLowerCase(), phone = clean(form, "phone"), address = clean(form, "address");
  if (!safeText(name, 3, CUSTOMER_LIMITS.name)) return { error: "El nombre debe tener entre 3 y 100 caracteres." };
  if (email && (email.length > CUSTOMER_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { error: "Ingresa un correo válido de hasta 120 caracteres." };
  if (phone && !/^9\d{8}$/.test(phone)) return { error: "El celular debe tener nueve dígitos y comenzar con 9." };
  if (!safeText(address, 0, CUSTOMER_LIMITS.address)) return { error: "La dirección admite hasta 250 caracteres." };
  return { data: { nombre_completo: name, correo: email || null, telefono: phone || null, direccion: address || null } };
}

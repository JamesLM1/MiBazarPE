/** Each photograph is used once in the complete four-scene story. */
export const storyImages = [
  "01-bookshop", "02-stationery", "03-florist", "04-hardware",
  "05-general-store", "06-ceramics", "07-grocer", "08-window",
  "09-delivery", "10-family-shop", "11-display", "12-evening",
  "13-ledger", "14-receipts", "15-reconcile", "16-notes",
  "17-counting", "18-stockroom", "19-check-stock", "20-shelves",
  "21-checkout", "22-advice", "23-regular", "24-trust",
].map(name => ({ file: `${name}.webp` }));

export const storyChapters = [
  {
    number: "01", label: "El negocio", title: ["Detrás de cada bazar,", "hay una historia."],
    description: "Personas que abren temprano, conocen a sus clientes y sostienen un negocio cada día.",
    images: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    number: "02", label: "El problema", title: ["Cuando todo se anota,", "algo se puede perder."],
    description: "Cuadernos, recibos y cuentas separadas hacen más difícil seguir cada venta y cada saldo.",
    images: [12, 13, 14, 15],
  },
  {
    number: "03", label: "El inventario", title: ["Saber qué tienes.", "Saber qué hace falta."],
    description: "Cada producto cuenta. Entradas, salidas y existencias necesitan estar conectadas.",
    images: [16, 17, 18, 19],
  },
  {
    number: "04", label: "Las personas", title: ["La confianza", "necesita claridad."],
    description: "Para quien vende y para quien compra: operaciones, abonos y saldos fáciles de consultar.",
    images: [20, 21, 22, 23],
  },
] as const;

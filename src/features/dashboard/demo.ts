import type { FinancialOverview, SalesPoint } from "./presentation";
const points = (labels: string[], amounts: number[]): SalesPoint[] => labels.map((label, i) => ({ label, amount: amounts[i] }));
// Fictional, deterministic preview. Never merged with live inventory.
export const dashboardDemo: FinancialOverview = {
  source: "demo", todaySales: "1840.00", todayIncome: "1520.00", receivables: "12450.00",
  sales: {
    day: points(["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"], [80, 240, 180, 390, 210, 460, 280]),
    week: points(["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"], [1250, 1640, 1420, 2100, 1780, 2460, 1840]),
    month: points(["01 oct", "03 oct", "05 oct", "07 oct", "09 oct", "11 oct", "13 oct", "15 oct", "17 oct", "19 oct", "21 oct", "23 oct", "25 oct", "27 oct", "29 oct", "31 oct"], [850, 1200, 1020, 1520, 1300, 1780, 1560, 2140, 1870, 2380, 2090, 2690, 2230, 2840, 2470, 3120]),
    year: points(["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"], [16400, 18200, 17100, 21300, 20400, 24700, 23500, 27100, 25900, 28400, 30900, 34200]),
  },
  categories: [
    { name: "Abarrotes", amount: 4800, fill: "#006eff" }, { name: "Bebidas", amount: 3250, fill: "#5596db" },
    { name: "Limpieza", amount: 2100, fill: "#70a4ba" }, { name: "Cuidado personal", amount: 1600, fill: "#787f8d" },
    { name: "Otros", amount: 950, fill: "#555b66" },
  ],
  accountStates: [
    { name: "Al día", amount: 7100, fill: "#006eff" }, { name: "Próximo a vencer", amount: 3200, fill: "#70a4ba" },
    { name: "Vencido", amount: 2150, fill: "#aa8b74" }, { name: "Pagado", amount: 5800, fill: "#697483" },
  ],
  due: [
    { id: "demo-1", dayLabel: "Hoy", date: "2026-10-10", name: "Carlos Mendoza", detail: "Cuota 3/6", amount: "250.00", status: "Pendiente", kind: "receivable" },
    { id: "demo-2", dayLabel: "Hoy", date: "2026-10-10", name: "Ana Torres", detail: "Cuota 2/4", amount: "180.00", status: "Pendiente", kind: "receivable" },
    { id: "demo-3", dayLabel: "Mañana", date: "2026-10-11", name: "Distribuidora XYZ", detail: "Cuenta por pagar", amount: "820.00", status: "Próximo a vencer", kind: "payable" },
  ],
};
export const demoLowStock = 8;

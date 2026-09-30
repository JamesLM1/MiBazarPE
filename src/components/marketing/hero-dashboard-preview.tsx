import Image from "next/image";
import {
  ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, ChevronDown,
  CreditCard, LayoutDashboard, Package, Settings2, ShoppingBag, Users, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./hero.module.css";

// Static illustration data only: independent of business entities and services.
const previewNavigation = [
  { label: "Resumen", icon: LayoutDashboard },
  { label: "Ventas", icon: ShoppingBag },
  { label: "Inventario", icon: Package },
  { label: "Clientes", icon: Users },
  { label: "Créditos", icon: CreditCard },
  { label: "Caja", icon: Wallet },
];

const previewMetrics = [
  { label: "Ventas del mes", value: "S/ 12,450", detail: "68 ventas", icon: ShoppingBag },
  { label: "Por cobrar", value: "S/ 2,180", detail: "12 créditos", icon: CreditCard },
  { label: "Caja disponible", value: "S/ 3,640", detail: "Resumen del día", icon: Wallet },
];

const previewBars = [32, 48, 39, 62, 45, 56, 74, 60, 70, 53, 79, 67, 87, 74, 95, 82];
const previewOperations = [
  { label: "Venta de productos", reference: "Venta #0086", method: "Contado", value: "S/ 148.00", icon: ArrowUpRight },
  { label: "Pago de cuota", reference: "Crédito #0012", method: "Abono", value: "S/ 85.00", icon: ArrowDownLeft },
  { label: "Venta de productos", reference: "Venta #0085", method: "Crédito", value: "S/ 230.00", icon: ArrowUpRight },
];

export function HeroDashboardPreview() {
  return (
    <figure className={styles.preview} aria-labelledby="hero-preview-caption">
      <div aria-hidden="true" className={styles.glow} />
      {/* One accessible description replaces decorative, non-interactive UI. */}
      <div
        role="img"
        aria-label="Vista ilustrativa de MiBazarPE: resumen de ventas, inventario, clientes, créditos y caja, con tarjetas, gráfico y operaciones recientes. Todos los valores son ficticios."
        className={styles.dashboard}
      >
        <div aria-hidden="true" className="flex min-w-0 text-xs">
          <div className="hidden w-36 shrink-0 flex-col border-r border-border/60 bg-background/40 p-3 sm:flex lg:hidden xl:flex">
            <Image src="/brand/mibazarpe-logo.png" alt="" width={2172} height={724} unoptimized className="mx-1 mt-2 mb-8 h-auto w-28" />
            <div className="mb-3 px-2 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Mi negocio</div>
            <div className="space-y-1">
              {previewNavigation.map(({ label, icon: Icon }, index) => (
                <div key={label} className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2.5", index === 0 ? "bg-primary/15 font-medium text-ring" : "text-muted-foreground")}>
                  <Icon className="size-3.5 shrink-0" />{label}
                </div>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-2 border-t border-border/60 px-2 pt-4 text-muted-foreground">
              <Settings2 className="size-3.5" /> Configuración
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex h-12 items-center justify-between gap-2 border-b border-border/60 px-4 sm:px-5">
              <Image src="/brand/mibazarpe-logo.png" alt="" width={2172} height={724} unoptimized className="h-auto w-24 sm:hidden lg:block xl:hidden" />
              <span className="hidden items-center gap-2 font-medium sm:flex lg:hidden xl:flex"><LayoutDashboard className="size-3.5 text-muted-foreground" /> Resumen del negocio</span>
              <span className="rounded-md border border-border/70 bg-secondary/50 px-2 py-1 text-[10px] tracking-wide text-muted-foreground">DEMO</span>
            </div>

            <div className="space-y-3 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold tracking-tight">Tu bazar, en un vistazo</p>
                </div>
                <span className="hidden shrink-0 items-center gap-2 rounded-md border border-border/70 px-2 py-1.5 text-[10px] text-muted-foreground xl:flex">Este mes <ChevronDown className="size-3" /></span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {previewMetrics.map(({ label, value, detail, icon: Icon }, index) => (
                  <div key={label} className={cn("min-w-0 rounded-lg border border-border/70 bg-secondary/35 p-2.5", index === 2 && "col-span-2 sm:col-span-1")}>
                    <div className="mb-2 flex items-center justify-between gap-1 text-[10px] text-muted-foreground"><span>{label}</span><Icon className="size-3 shrink-0" /></div>
                    <p className="text-base font-semibold tracking-tight tabular-nums xl:text-xl">{value}</p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border/70 bg-background/25 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">Resumen de ventas</p>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Ventas</span>
                </div>
                <div className="relative mt-4 h-24">
                  <div className="absolute inset-0 flex flex-col justify-between pb-0.5">
                    {[0, 1, 2, 3].map((line) => <div key={line} className="border-t border-dashed border-border/55" />)}
                  </div>
                  <div className="relative flex h-full items-end gap-1.5 px-1 sm:gap-2">
                    {previewBars.map((height, index) => (
                      <div key={index} style={{ height: `${height}%` }} className="min-w-0 flex-1 rounded-t-sm border-t border-primary/80 bg-linear-to-t from-primary/20 to-primary/80" />
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>Sem. 1</span><span>Sem. 2</span><span>Sem. 3</span><span>Sem. 4</span></div>
              </div>

              <div className="rounded-lg border border-border/70 bg-background/25 px-3 pt-3 sm:px-4">
                <div className="mb-2 flex items-center justify-between"><p className="font-medium">Operaciones recientes</p><ChartNoAxesCombined className="size-3.5 text-muted-foreground" /></div>
                {previewOperations.map(({ label, reference, method, value, icon: Icon }) => (
                  <div key={reference} className="flex items-center gap-2 border-t border-border/50 py-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-3.5" /></span>
                    <div className="min-w-0 flex-1"><p className="text-[11px]">{label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{reference}</p></div>
                    <span className="hidden text-[10px] text-muted-foreground sm:block">{method}</span>
                    <span className="ml-1 shrink-0 text-[11px] font-medium tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption id="hero-preview-caption" className="relative mt-10 text-center text-xs leading-5 text-muted-foreground sm:mt-12">
        Vista previa del producto · Datos de demostración
      </figcaption>
    </figure>
  );
}

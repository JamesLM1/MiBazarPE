import { LayoutDashboard, ShoppingCart, ShoppingBag, Package, UsersRound, HandCoins, ArrowDownLeft, ArrowUpRight, Wallet, ChartNoAxesCombined, Bot, Settings, ShieldCheck, UserRound, Mail, FileSpreadsheet } from "lucide-react";

// Presentation metadata; access is always enforced by the server and existing RLS.
export const privateNavigation = [
  { href: "/dashboard", label: "Inicio", title: "Dashboard", icon: LayoutDashboard, group: "Resumen" },
  { href: "/ventas", label: "Ventas", title: "Ventas", icon: ShoppingCart, group: "Operaciones" },
  { href: "/compras", label: "Compras", title: "Compras", icon: ShoppingBag, group: "Operaciones" },
  { href: "/inventario", label: "Inventario", title: "Inventario", icon: Package, group: "Operaciones" },
  { href: "/importar", label: "Importar datos", title: "Importar datos", icon: FileSpreadsheet, group: "Operaciones" },
  { href: "/clientes", label: "Clientes", title: "Clientes", icon: UsersRound, group: "Gestión" },
  { href: "/creditos", label: "Créditos", title: "Créditos", icon: HandCoins, group: "Gestión" },
  { href: "/pagos", label: "Pagos y cobros", title: "Pagos y cobros", icon: Wallet, group: "Gestión" },
  { href: "/invitaciones", label: "Invitaciones", title: "Acceso de clientes", icon: Mail, group: "Gestión" },
  { href: "/liquidaciones", label: "Liquidaciones", title: "Liquidaciones", icon: HandCoins, group: "Finanzas" },
  { href: "/notificaciones", label: "Notificaciones", title: "Notificaciones", icon: Mail, group: "Sistema" },
  { href: "/caja", label: "Caja", title: "Caja", icon: Wallet, group: "Gestión" },
  { href: "/cuentas-por-cobrar", label: "Cuentas por cobrar", title: "Cuentas por cobrar", icon: ArrowDownLeft, group: "Finanzas" },
  { href: "/cuentas-por-pagar", label: "Cuentas por pagar", title: "Cuentas por pagar", icon: ArrowUpRight, group: "Finanzas" },
  { href: "/reportes", label: "Reportes", title: "Reportes", icon: ChartNoAxesCombined, group: "Análisis" },
  { href: "/bazi", label: "Bazi", title: "Asistente del negocio", icon: Bot, group: "Inteligencia" },
  { href: "/configuracion", label: "Configuración", title: "Configuración", icon: Settings, group: "Sistema" },
] as const;
export function navigationForRole(role:string|null,hasBusiness=true) {
 const profile={href:"/perfil",label:"Mi perfil",title:"Mi perfil",icon:UserRound,group:"Sistema"};
 const portal={href:"/portal",label:"Mi cuenta cliente",title:"Mi cuenta cliente",icon:UserRound,group:"Resumen"};
 if(role==='CLIENTE')return [portal,{href:"/bazi",label:"Bazi",title:"Asistente de mi cuenta",icon:Bot,group:"Inteligencia"},profile,{href:"/configuracion",label:"Configuración",title:"Configuración",icon:Settings,group:"Sistema"}];
 if(!role)return [profile,{href:"/mi-negocio",label:"Mi negocio",title:"Mi negocio",icon:ShoppingBag,group:"Resumen"}];
 if(role==='DUENO_BAZAR'&&!hasBusiness)return [privateNavigation[0],{href:"/mi-negocio/nuevo",label:"Crear mi negocio",title:"Crear mi negocio",icon:ShoppingBag,group:"Resumen"},{href:"/importar",label:"Importar datos",title:"Importar datos",icon:FileSpreadsheet,group:"Operaciones"},profile,{href:"/configuracion",label:"Configuración",title:"Configuración",icon:Settings,group:"Sistema"}];
 return [...(role==='SUPERADMIN'?[{href:"/admin",label:"Administración",title:"Administración general",icon:ShieldCheck,group:"Resumen"}]:[]),...privateNavigation,portal];
}

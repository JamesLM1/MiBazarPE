# Área privada de MiBazarPE

## Composición de esta etapa

Adaptación independiente de la referencia pública https://efferd.com/view/dashboard-12.
El registry configurado usa radix-nova. EFFERD_REGISTRY_TOKEN no está configurado y
el endpoint oficial dashboard-12 devuelve 401: no se instaló código Pro, no se
reinicializó shadcn ni se cambiaron components.json o dependencias.
https://efferd.com/view/dashboard-10 inspira solamente la tarjeta inferior de Bazi.
Se reutilizan Button, Input, Radix Dialog/DropdownMenu/Tooltip, Lucide y Recharts
que ya estaban presentes. Bazi usa public/brand/bazi/welcome.png sin alterarlo.

Layout persistente (app): sidebar colapsable, drawer móvil, topbar y contenido.
Dashboard: cuatro KPI, ventas por día/semana/mes/año, vencimientos, categorías y
estado de cuentas por cobrar. Los demás módulos conservan páginas de preparación.
La búsqueda navega entre módulos; buscar productos dirige a Inventario. No consulta
registros todavía. Notificaciones y Bazi son accesos preparados, sin servicio de IA
ni motor de notificaciones. Ver cronograma dirige a Cuentas por cobrar, módulo pendiente.

## Esquema remoto verificado en lectura el 10 de octubre de 2026

Proyecto existente juiygtydkwflnwapkqsx. Tablas públicas: perfiles, bazares,
usuarios_bazar, clientes, productos y configuraciones_credito. No están presentes
ventas, compras, pagos, créditos, cuotas o cuentas por pagar. Todas las tablas tienen
RLS activo, cero políticas y ningún permiso SELECT para authenticated. Esta etapa
no modifica esquema, grants, RLS, cuentas ni registros.

Se conserva getPrivateContext y el cliente SSR existente. auth.getUser verifica
la identidad en servidor. El proxy renueva la sesión y protege las rutas privadas;
se añadieron cuentas-por-cobrar, cuentas-por-pagar y mi-negocio a su cobertura.
Perfil real: perfiles.id; membresía: usuarios_bazar.id_usuario y bazares.id_bazar.
La identidad puede mostrar metadata de Auth, pero nunca autorizar con ella.
Una cookie de bazar se valida contra membresías bajo RLS. Sin perfil activo o
membresía accesible no se consultan productos ni clientes. No se usa service_role.

Los códigos DUENO_BAZAR/PROPIETARIO se presentan como Administrador y COLABORADOR
como Vendedor. Es un mapeo visual autorizado, no una migración ni nuevos permisos.
Si no hay perfil visible se muestra Cuenta sin perfil, sin inventar un rol.

## Datos y demostración

La vista inicial usa datos reales disponibles y estados pendientes. Stock bajo
conserva el adaptador existente, paginado y filtrado por bazar, e incluye agotados.
Una consulta denegada no se convierte en cero. En la sesión revisada no hay acceso
a datos comerciales, por lo que los KPI muestran un guion, no saldos supuestos.

presentation.ts define el contrato de los futuros adaptadores financieros y un
estado unavailable explícito. Los importes se mantienen como strings en la frontera;
las conversiones numéricas de gráficos son exclusivamente de presentación.
demo.ts contiene todos los ejemplos ficticios. Ver demostración sustituye el resumen
completo, incluido stock, y muestra una advertencia visible. Salir de demostración
restaura los datos disponibles. La demo no se escribe en Supabase ni se combina con
registros reales. El selector temporal cambia solo la curva; los KPI siguen siendo
Ventas de hoy e Ingresos de hoy. Categorías/cartera tienen su propio alcance.

## Validación

Typecheck y build de producción aprobados. Las 11 pruebas dashboard existentes
aprobaron, incluyendo aislamiento de bazar, perfil inactivo/CLIENTE, denegación RLS,
paginación y rutas protegidas. Lint acotado al área privada y sus pruebas aprobado.
El lint global detecta 52 errores y 7 advertencias en assets/bazi, anteriores a esta
etapa; no se modificaron esos archivos ni se ocultaron con nuevas exclusiones.

Chrome con la sesión Supabase existente: 1440, 1024, 768 y 390 px; navegación,
sidebar colapsado/expandido, drawer, menú de usuario, búsqueda de módulos, demo,
selector temporal y tooltip por teclado. Sin overflow horizontal tras contener
las mediciones de tooltips de Recharts. prefers-reduced-motion desactiva transiciones.
No se probó cierre de la sesión real ni se simularon permisos comerciales existentes.
Landing, Login, Register, header/footer públicos y globals.css se conservan intactos.

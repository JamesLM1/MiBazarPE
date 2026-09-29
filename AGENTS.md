# MiBazarPE — MASTER CONTEXT FOR CODEX
> Archivo consolidado. La carpeta también contiene los documentos separados.


---

<!-- BEGIN README.md -->

# MiBazarPE — Paquete de contexto para Codex

Este directorio concentra el contexto funcional, técnico y visual que Codex debe leer antes de modificar el proyecto.

## Orden recomendado de lectura

1. `AGENTS.md`
2. `SOURCE_OF_TRUTH.md`
3. `PROJECT_CONTEXT.md`
4. `ARCHITECTURE.md`
5. `DATABASE.md`
6. `BUSINESS_RULES.md`
7. `AUTH_SECURITY.md`
8. `UI_DESIGN_SYSTEM.md`
9. `ENVIRONMENT.md`
10. `CURRENT_STATE.md`
11. `ROADMAP.md`
12. `UNRESOLVED_QUESTIONS.md`
13. `CODEX_START_PROMPT.md`

## Principio general

MiBazarPE **no parte desde cero**. Ya existe una base funcional en Supabase/PostgreSQL con autenticación, tablas, restricciones, funciones, triggers y datos de prueba. También se seleccionó un sistema visual basado en bloques Efferd + shadcn/ui.

Codex debe leer y entender antes de escribir, inspeccionar el repositorio y la base real antes de crear estructuras, conservar las reglas financieras ya definidas, no exponer secretos y no rediseñar arbitrariamente la interfaz.

## Fuente académica principal

El documento académico proporcionado por el equipo es `TP-Finanzas (2).pdf`. Este paquete resume su contexto de negocio, objetivos, reglas financieras y módulos funcionales, y lo combina con el estado técnico alcanzado posteriormente en Supabase.

Si existe una contradicción entre este paquete y la base de datos real, primero se inspecciona la base real y luego se reporta la discrepancia antes de modificar nada.

<!-- END README.md -->


---

<!-- BEGIN AGENTS.md -->

# AGENTS.md — Reglas obligatorias para Codex

## Lectura previa obligatoria

Antes de editar, generar, instalar, migrar o borrar cualquier cosa, leer todos los Markdown de este paquete, especialmente:

- `SOURCE_OF_TRUTH.md`
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `BUSINESS_RULES.md`
- `AUTH_SECURITY.md`
- `UI_DESIGN_SYSTEM.md`
- `CURRENT_STATE.md`
- `ROADMAP.md`
- `UNRESOLVED_QUESTIONS.md`

Después, inspeccionar el repositorio real.

## Primera interacción

No empezar implementando. Primero:

1. leer;
2. inspeccionar el repo;
3. detectar stack y archivos existentes;
4. identificar inconsistencias;
5. resumir lo comprendido;
6. proponer orden de trabajo;
7. esperar aprobación.

## Stack objetivo

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Efferd
- Supabase
- PostgreSQL
- Supabase Auth
- Cloudflare Turnstile
- Brevo SMTP

No introducir Astro, otro framework frontend, otro proveedor de autenticación, ORM o segunda base de datos sin aprobación explícita.

## Arquitectura

Separar UI/presentación, aplicación/casos de uso, dominio/reglas, infraestructura y acceso a datos. No colocar cálculos financieros complejos dentro de componentes React.

La lógica que ya exista de forma segura en PostgreSQL/Supabase no debe duplicarse de manera inconsistente en frontend.

## Base de datos

Supabase/PostgreSQL es la fuente operacional. Antes de crear tablas, columnas, policies RLS, funciones, triggers o RPCs, inspeccionar lo que ya existe. No inventar nombres.

Nunca ejecutar `DROP`, `TRUNCATE`, borrado masivo o migración destructiva sin explicar el cambio, riesgo y reversión, y recibir aprobación.

## Seguridad

Nunca imprimir, commitear o exponer:

- `SUPABASE_SERVICE_ROLE_KEY`
- contraseñas
- credenciales SMTP
- `TURNSTILE_SECRET_KEY`
- `EFFERD_REGISTRY_TOKEN`
- tokens privados

La `service_role` nunca debe llegar al navegador. Mantener y auditar RLS.

## Autenticación y roles

Supabase Auth es el proveedor de identidad.

Roles confirmados:

- `DUENO_BAZAR`
- `CLIENTE`
- `SUPERADMIN`

El registro público normal está orientado al dueño del bazar. El cliente puede existir primero como registro comercial y luego vincularse mediante invitación. `SUPERADMIN` nunca es públicamente asignable.

## Finanzas

No redondear de forma temprana. Respetar:

- año comercial de 360 días;
- mes comercial de 30 días cuando corresponda;
- método francés vencido;
- separación capital/interés/mora;
- orden de imputación configurado;
- precisión suficiente para tasas y dinero.

## Diseño

Los bloques Efferd seleccionados son la referencia estructural aprobada. Preservar composición, jerarquía, espaciado, responsive, animaciones y patrón visual. Adaptar textos, marca, logo, colores, iconos, ilustraciones, datos y screenshots a MiBazarPE.

## Efferd Pro

Si un bloque requiere `EFFERD_REGISTRY_TOKEN`, comprobar la variable y nunca mostrarla. Si falta, detener solo esa instalación y reportarlo.

## Calidad

Priorizar TypeScript estricto, componentes reutilizables, validación, accesibilidad, responsive, manejo explícito de errores, pruebas financieras, seguridad y trazabilidad.

## Documento académico vs esquema vivo

El PDF contiene nombres conceptuales que pueden diferir del esquema actual. Si hay contradicción, no corregir silenciosamente: reportar, inspeccionar y proponer reconciliación.

## Antes de declarar terminado

Según corresponda, ejecutar lint, typecheck, tests, build, validación de auth, RLS, rutas y responsive. Informar qué quedó probado y qué no.

<!-- END AGENTS.md -->


---

<!-- BEGIN SOURCE_OF_TRUTH.md -->

# Jerarquía de fuentes de verdad

Cuando dos fuentes discrepen, aplicar este orden:

## Nivel 1 — Estado real

1. Esquema vivo de Supabase/PostgreSQL.
2. Código existente en el repositorio.
3. Variables de entorno reales.

## Nivel 2 — Decisiones técnicas aprobadas

Este paquete: arquitectura, seguridad, stack, diseño, convenciones y roadmap.

## Nivel 3 — Documento académico

`TP-Finanzas (2).pdf` es la fuente principal para propósito, problema, reglas financieras, conceptos, módulos, requisitos académicos, equipo y marco legal/teórico.

## Nivel 4 — Referencias visuales

Capturas y bloques Efferd. Son referencia de composición y experiencia, no de reglas de negocio.

## Regla de discrepancia

No arreglar automáticamente. Registrar:

- qué fuente dice A;
- qué implementación dice B;
- impacto;
- recomendación;

y solicitar aprobación.

<!-- END SOURCE_OF_TRUTH.md -->


---

<!-- BEGIN PROJECT_CONTEXT.md -->

# MiBazarPE — Contexto del proyecto

## Identificación académica

Curso: **Finanzas e Ingeniería Económica**

Carreras: **Ingeniería de Software e Ingeniería de Sistemas**

Sección: **1ASI0642-2620-7699**

Docente: **Nataly Bravo López**

Integrantes:

- Camus Dominguez, Luis Diego — U202319510
- Aguirre Gutierrez, Diego Alexander — U202319891
- Rodriguez Espinoza, Jairo Jalil Antonino — U202314393
- Lucas Moreto, James — U202317816
- Valderrama Bautista, Oscar Enrique — U202312314
- Villarroel Antonio, Alex Oswaldo — U202315087

## Problema

En bazares y comercios minoristas locales, los créditos comerciales suelen registrarse manualmente en cuadernos, generando riesgos de pérdida de información, descuadres de saldos, dificultad para conocer deuda real, errores al calcular intereses y poco control de inventario.

## Propuesta

**MiBazarPE** es una plataforma web para pequeños bazares y comercios minoristas que centraliza:

- catálogo de productos;
- inventario;
- clientes;
- ventas;
- ventas al contado;
- ventas al crédito;
- cuentas corrientes;
- líneas de crédito;
- cronogramas;
- cuotas;
- pagos;
- mora;
- intereses;
- configuración financiera;
- reportes.

Combina gestión comercial con matemática financiera.

## Usuarios

### Dueño del bazar
Administra bazar, clientes, productos, inventario, ventas, créditos, pagos, configuración y reportes.

### Cliente
Puede existir como registro comercial sin cuenta de acceso. Luego puede ser invitado y vincularse a una cuenta autenticada.

### Superadministrador
Rol interno de alto privilegio; no públicamente asignable.

## Dos superficies

### Sitio público
Debe existir antes del dashboard y explicar qué es MiBazarPE, qué problema resuelve, funcionalidades, equipo, tecnologías, FAQ, pricing, contacto, blog y acceso/registro.

### Aplicación autenticada
Módulos previstos:

- Dashboard
- Ventas
- Clientes
- Productos
- Inventario
- Créditos
- Cuentas corrientes / por cobrar
- Cuotas
- Pagos
- Reportes
- Configuración financiera
- Perfil
- Gestión del bazar

## Enfoque financiero

El documento contempla liquidación a fin de mes, interés compensatorio, interés moratorio, crédito en cuotas, método francés, capitalización durante gracia, línea de crédito, fechas de corte/pago, saldo insoluto y conversión de tasas.

## Calidad

La solución debe ser robusta, segura, usable, responsive, mantenible, auditable y exacta en cálculos financieros.

## Marco legal/teórico citado en el documento

- Ley N.º 26702
- Resolución SBS N.º 8181-2012
- Ley N.º 29733
- Scrum
- ISO/IEC 25010
- matemática financiera
- método francés
- equivalencia y conversión de tasas

Este paquete no reemplaza una revisión legal final.

<!-- END PROJECT_CONTEXT.md -->


---

<!-- BEGIN ARCHITECTURE.md -->

# Arquitectura objetivo

## Principio

MiBazarPE utilizará una aplicación web full-stack moderna con **Next.js** como framework principal. No se recomienda dividir prematuramente el producto entre Astro + Next.js; Next.js puede cubrir tanto el sitio público como la aplicación autenticada.

## Stack base

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- bloques Efferd

### Backend / datos
- Supabase
- PostgreSQL
- Supabase Auth
- RLS
- PostgreSQL functions/RPC
- triggers y constraints

### Seguridad / servicios
- Cloudflare Turnstile
- Brevo SMTP
- variables de entorno

## Estructura conceptual recomendada

```text
src/
  app/
    (marketing)/
    (auth)/
    (app)/
  components/
    ui/
    marketing/
    app-shell/
    charts/
  features/
    auth/
    bazares/
    clientes/
    productos/
    inventario/
    ventas/
    creditos/
    pagos/
    reportes/
  domain/
    finance/
    inventory/
    sales/
  infrastructure/
    supabase/
    email/
    captcha/
  lib/
    validation/
    format/
    constants/
```

La estructura exacta debe adaptarse al repositorio existente.

## Route Groups

Separar tres experiencias:

- `(marketing)`
- `(auth)`
- `(app)`

Esto permite layouts, middleware y navegación distintos.

## Acceso a datos

Preferir una capa explícita por dominio. No distribuir consultas Supabase arbitrariamente por todos los componentes.

## Server vs Client

Preferir Server Components cuando no exista necesidad de interacción cliente. Usar Client Components para formularios interactivos, gráficos, modales, filtros, animaciones y estados locales.

## Reglas financieras

Los cálculos sensibles deben residir en funciones PostgreSQL, módulos de dominio testeables o ambos, con una sola fuente de verdad. No replicar fórmulas de forma distinta en varias pantallas.

## Autorización

No confiar solo en ocultar botones. La autorización debe estar respaldada por sesión Supabase, rol, pertenencia al bazar, RLS y funciones seguras.

## Multi-bazar

El esquema usa `id_bazar` en entidades clave. Toda consulta de negocio debe aislar datos por bazar. Nunca depender solo de filtros frontend.

## Responsive

Landing y dashboard deben funcionar en desktop, tablet y móvil. El dashboard puede tener navegación lateral colapsable.

## Errores

Distinguir validación, autorización, negocio, base de datos, red e inesperado. No mostrar errores internos de PostgreSQL directamente al usuario.

## Dependencias nuevas

Antes de agregar una dependencia:
- comprobar si ya existe solución en shadcn/Efferd;
- justificar necesidad;
- revisar peso/mantenimiento;
- evitar duplicados.

<!-- END ARCHITECTURE.md -->


---

<!-- BEGIN DATABASE.md -->

# Base de datos — Inventario conocido

> Este archivo documenta el estado conocido durante la construcción. Codex debe inspeccionar Supabase antes de asumir que la estructura sigue idéntica.

## Plataforma

PostgreSQL mediante Supabase.

## Tablas principales confirmadas

### Identidad y acceso
- `auth.users`
- `public.perfiles`
- `public.roles_sistema`
- `public.usuario_roles`
- `public.bazares`
- `public.usuarios_bazar`

### Clientes e inventario
- `public.clientes`
- `public.productos`
- `public.movimientos_inventario`

### Finanzas y ventas
- `public.configuracion_financiera_bazar`
- `public.ventas`
- `public.cuentas_corrientes`
- `public.creditos`
- `public.cuotas_credito`
- `public.pagos`
- `public.aplicaciones_pago`

No crear duplicados de estas tablas.

## RLS confirmado durante la configuración

Se verificó `rowsecurity = true` en:
- `bazares`
- `perfiles`
- `roles_sistema`
- `usuario_roles`
- `usuarios_bazar`

Las tablas financieras deben auditarse nuevamente antes de producción.

## Roles

| Código | Nombre | Asignable públicamente |
|---|---|---:|
| CLIENTE | Cliente | false |
| DUENO_BAZAR | Dueño del bazar | true |
| SUPERADMIN | Superadministrador | false |

Interpretación: dueño se registra, cliente puede llegar por invitación, superadmin no surge de registro público.

## `public.perfiles`

Relación conocida:
- `id_usuario UUID`
- referencia `auth.users(id)`
- borrado en cascada

No almacena contraseñas.

## `public.clientes`

Columnas confirmadas:
- `id_cliente uuid` obligatorio
- `id_bazar uuid` obligatorio
- `id_usuario uuid` nullable
- `nombres text` obligatorio
- `apellidos text` obligatorio
- `tipo_documento varchar` obligatorio
- `numero_documento varchar` obligatorio
- `correo text` nullable
- `telefono varchar` nullable
- `direccion text` nullable
- `estado varchar` obligatorio
- `estado_acceso varchar` obligatorio
- `fecha_invitacion timestamptz` nullable
- `fecha_vinculacion timestamptz` nullable
- `created_at timestamptz` obligatorio
- `updated_at timestamptz` obligatorio

`id_usuario` es nullable porque un cliente puede existir comercialmente sin cuenta.

## `public.productos`

Columnas confirmadas:
- `id_producto uuid`, default `gen_random_uuid()`
- `id_bazar uuid`
- `codigo_sku varchar`
- `nombre text`
- `descripcion text` nullable
- `categoria varchar` nullable
- `marca varchar` nullable
- `unidad_medida varchar`, default `UNIDAD`
- `costo_unitario numeric` nullable
- `precio_venta numeric`
- `stock_actual integer`, default `0`
- `stock_minimo integer`, default `5`
- `permite_venta_credito boolean`, default `true`
- `estado varchar`, default `ACTIVO`
- `created_at timestamptz`, default `now()`
- `updated_at timestamptz`, default `now()`

### Discrepancia con el documento académico

El documento académico describe `precio_contado` y `precio_credito`, mientras que el esquema observado usa `precio_venta`.

No agregar columnas para reconciliarlo sin decisión funcional explícita.

## `public.movimientos_inventario`

Columnas confirmadas:
- `id_movimiento uuid`, default `gen_random_uuid()`
- `id_producto uuid`
- `tipo_movimiento varchar`
- `cantidad integer`
- `stock_anterior integer`
- `stock_resultante integer`
- `motivo text` nullable
- `referencia varchar` nullable
- `id_usuario_registro uuid` nullable
- `created_at timestamptz`, default `now()`

Constraints observados:
- cantidad > 0
- stock_anterior >= 0
- stock_resultante >= 0
- FK producto
- FK usuario registro
- PK movimiento
- check de tipos de movimiento

Trigger:
- `trg_registrar_movimiento_inventario`

Función asociada:
- `public.registrar_movimiento_inventario()`

No actualizar `stock_actual` manualmente desde frontend ignorando el mecanismo existente.

## Funciones confirmadas

Se verificaron como `SECURITY DEFINER`:
- `public.registrar_bazar_propio`
- `public.crear_invitacion_cliente`
- `public.aceptar_invitacion_cliente`
- `public.obtener_contexto_usuario`

También existe:
- `public.registrar_movimiento_inventario`

Al modificar funciones `SECURITY DEFINER`, revisar `auth.uid()`, pertenencia al bazar, `search_path`, permisos `EXECUTE`, SQL injection y escalamiento de privilegios.

## `public.configuracion_financiera_bazar`

Columnas confirmadas:
- `id_bazar`
- `dia_corte`
- `dia_pago`
- `ajuste_fin_mes`
- `base_anual`
- `dias_mes_comercial`
- `metodo_amortizacion`
- `regla_interes`
- `orden_imputacion_pago`
- `estado`
- `created_at`
- `updated_at`

Configuración de prueba verificada:
- `dia_corte = 25`
- `dia_pago = 30`
- `ajuste_fin_mes = true`
- `base_anual = 360`
- `dias_mes_comercial = 30`
- `metodo_amortizacion = FRANCES_VENCIDO`
- `regla_interes = SIMPLE_ORDINARIO`
- `orden_imputacion_pago = MORA_INTERES_CAPITAL`
- `estado = ACTIVO`

Es escenario de prueba, no configuración universal.

## `public.creditos`

Columnas confirmadas mediante inspección:
- `id_credito uuid`
- `id_venta uuid`
- `id_cuenta uuid`
- `fecha_otorgamiento date`
- `fecha_focal date`
- `fecha_primera_cuota date`
- `capital_original numeric`
- `saldo_capital numeric`
- `numero_cuotas integer`
- `tipo_tasa varchar`
- `tasa_ingresada_pct numeric`
- `periodo_tasa varchar`
- `capitalizacion varchar` nullable
- `tasa_periodica_decimal numeric` nullable
- `tea_decimal numeric` nullable
- `tem_decimal numeric` nullable
- `periodicidad_cuota varchar`, default `MENSUAL`
- `base_anual smallint`, default `360`
- `dias_mes_comercial smallint`, default `30`
- `metodo_amortizacion varchar`, default `FRANCES_VENCIDO`
- `regla_interes varchar`, default `SIMPLE_ORDINARIO`
- `ajuste_fin_mes boolean`, default `true`
- `estado varchar`, default `PENDIENTE`
- `id_usuario_registro uuid` nullable
- `observacion text` nullable
- `created_at timestamptz`, default `now()`
- `updated_at timestamptz`, default `now()`
- `tasa_diaria_decimal numeric` nullable
- `dias_gracia_total integer`, default `0`
- `tasa_moratoria_pct numeric`, default `0`
- `periodo_tasa_moratoria varchar`, default `ANUAL`
- `tasa_moratoria_diaria_decimal numeric`, default `0`

La inspección visual mostraba columnas intermedias adicionales no totalmente capturadas. Consultar `information_schema.columns` antes de programar.

## `public.cuentas_corrientes`

Columnas confirmadas:
- `id_cuenta uuid`, default `gen_random_uuid()`
- `id_cliente uuid`
- `moneda varchar`, default `PEN`
- `limite_credito numeric`, default `500.00`
- `saldo_actual numeric`, default `0.00`
- `estado varchar`, default `ACTIVA`
- `created_at timestamptz`, default `now()`
- `updated_at timestamptz`, default `now()`

## `public.cuotas_credito`

Columnas conocidas:
- `id_cuota uuid`
- `id_credito uuid`
- `numero_cuota integer`
- `fecha_vencimiento date`
- `saldo_inicial numeric`
- `interes_compensatorio numeric`
- `amortizacion numeric`
- `cuota_programada numeric`
- `saldo_final numeric`
- `monto_pagado numeric`, default `0`
- `mora_acumulada numeric`, default `0`
- `estado varchar`, default `PENDIENTE`
- `created_at timestamptz`, default `now()`
- `updated_at timestamptz`, default `now()`
- `mora_pagada numeric`, default `0`
- `interes_pagado numeric`, default `0`
- `capital_pagado numeric`, default `0`

## `public.pagos`

Columnas observadas como mínimo:
- `id_pago uuid`
- `id_credito uuid`
- `id_cuenta uuid`
- `fecha_pago date`
- `monto numeric`
- `monto_aplicado numeric`

La tabla contiene más estructura; consultar esquema real.

## `public.aplicaciones_pago`

Columnas confirmadas:
- `id_aplicacion uuid`, default `gen_random_uuid()`
- `id_pago uuid`
- `id_cuota uuid`
- `aplicado_mora numeric`, default `0`
- `aplicado_interes numeric`, default `0`
- `aplicado_capital numeric`, default `0`
- `total_aplicado numeric` nullable
- `created_at timestamptz`, default `now()`

## `public.ventas`

La tabla existe y participa en la relación con créditos. Su esquema debe inspeccionarse directamente antes de programar.

## Seeds

Durante el desarrollo se crearon clientes, productos, inventario, ventas, créditos, cuotas y moras de prueba. No asumir que esos registros son producción.

## Consulta inicial recomendada

```sql
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

Además revisar constraints, indexes, triggers, policies y routines.

<!-- END DATABASE.md -->


---

<!-- BEGIN BUSINESS_RULES.md -->

# Reglas de negocio y financieras

## Inventario

Una venta no se autoriza si la cantidad supera stock disponible.

```text
stock_resultante = stock_actual - cantidad
```

Debe cumplirse:

```text
stock_resultante >= 0
```

Cada movimiento debe dejar stock anterior, cantidad, stock resultante, motivo, referencia, usuario y fecha.

Si `stock_actual <= stock_minimo`, se debe poder mostrar alerta de stock bajo.

## Clientes

Un cliente puede existir sin cuenta, ser invitado después y vincularse a `auth.users`. El correo comercial no equivale automáticamente a una cuenta autenticada.

## Línea de crédito

Conceptualmente:

```text
saldo_disponible = limite_credito - deuda_actual
```

Una nueva venta al crédito debe bloquearse si supera el saldo disponible.

El documento plantea estados conceptuales como activo, al día, observado por mora y bloqueado; la implementación debe usar los valores reales del esquema vigente.

## Modalidades

El documento contempla:
- contado;
- crédito / fin de mes;
- crédito en cuotas.

El esquema real define las enumeraciones exactas.

## Fecha de corte y pago

La fecha de corte define qué operaciones ingresan al período actual. Las posteriores pasan al siguiente ciclo.

La fecha de pago define el límite sin mora.

La configuración es por bazar.

## Base temporal

Convención central:
- base anual comercial: 360;
- mes comercial: 30 días.

Cuando una regla exija días calendario reales, usar días reales. No confundir base de tasa con conteo de fechas.

## Tasas

El documento contempla TE, TN, TEA, TEM, TED, tasa compensatoria y moratoria.

Conversión efectiva conceptual:

```text
i2 = (1 + i1)^(n1/n2) - 1
```

TEA a diaria con base 360:

```text
TED = (1 + TEA)^(1/360) - 1
```

TEA a mensual comercial:

```text
TEM = (1 + TEA)^(30/360) - 1
```

## Período de gracia total

```text
P_gracia = P x (1 + i_d)^d
```

donde `P` es capital inicial, `i_d` tasa diaria y `d` días de gracia.

## Método francés vencido

Configuración conocida:

```text
FRANCES_VENCIDO
```

Cuota:

```text
C = P x [i(1+i)^n] / [(1+i)^n - 1]
```

Por período:

```text
interes = saldo_inicial x i
amortizacion = cuota - interes
saldo_final = saldo_inicial - amortizacion
```

La última cuota puede necesitar ajuste controlado por precisión para cerrar el saldo.

## Interés y mora

El interés compensatorio remunera el uso del capital. La mora se genera por atraso posterior a la fecha pactada.

```text
dias_atraso = max(0, fecha_pago_real - fecha_limite_pago)
```

No mezclar mora con interés compensatorio.

## Imputación de pago

Configuración de prueba observada:

```text
MORA_INTERES_CAPITAL
```

Orden:
1. mora;
2. interés;
3. capital.

La tabla `aplicaciones_pago` refleja esos componentes.

## Precisión

Evitar redondeos intermedios innecesarios. Conservar precisión en tasas y cálculos. Mostrar dinero con redondeo de presentación, pero usar `numeric`, nunca float binario.

## Moneda

Principal:

```text
PEN
```

Visualmente:

```text
S/
```

## Consistencia transaccional

Crear venta a crédito, descontar stock, crear cuenta/crédito, generar cuotas y aplicar pagos deben ser operaciones atómicas o diseñadas para no dejar estados parciales.

## Fuente única del motor financiero

Si la fórmula vive en PostgreSQL/RPC, el frontend debe consumirla. Si existe simulador TypeScript, debe compartir los mismos casos de prueba y fórmulas.

<!-- END BUSINESS_RULES.md -->


---

<!-- BEGIN AUTH_SECURITY.md -->

# Autenticación y seguridad

## Supabase Auth

Proveedor principal:
- email;
- contraseña.

La confirmación de email fue habilitada durante la configuración.

Flujo esperado:

```text
Registro -> confirmación de correo -> acceso
```

## Perfil

`auth.users` contiene la identidad. `public.perfiles` contiene perfil de negocio. No almacenar contraseñas en `perfiles`.

## Contraseña

Durante la configuración se adoptó una longitud mínima objetivo de 10 caracteres.

Política recomendada:
- minúscula;
- mayúscula;
- dígito;
- símbolo.

Codex debe comprobar qué regla quedó guardada realmente en Supabase antes de mostrarla como requisito exacto.

`Secure password change` fue habilitado.

La protección contra contraseñas filtradas aparecía deshabilitada/dependiente del plan; no afirmar que está activa sin verificar.

## Cloudflare Turnstile

Proveedor Captcha configurado en Supabase Attack Protection.

Nunca exponer el secret.

Variables sugeridas:

```text
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

## Brevo SMTP

Proveedor elegido para correo transaccional/autenticación.

Nunca commitear usuario SMTP, password SMTP ni API keys.

## URL Auth de desarrollo

```text
Site URL:
http://localhost:3000

Redirect URL:
http://localhost:3000/**
```

Antes de producción se añaden dominios reales.

## RLS

Principios:
- usuario solo accede a bazares a los que pertenece;
- cliente no ve datos de otro cliente;
- dueño no ve bazares de terceros;
- superadmin requiere tratamiento explícito.

No confiar en filtros frontend.

## SECURITY DEFINER

Existen funciones de este tipo. Toda función debe validar `auth.uid()`, pertenencia/rol, `search_path`, permisos y minimizar privilegios.

## Invitación de cliente

```text
Dueño crea cliente
  -> cliente comercial sin auth
  -> crear_invitacion_cliente
  -> usuario recibe invitación
  -> aceptar_invitacion_cliente
  -> clientes.id_usuario queda vinculado
```

No crear credenciales en nombre del cliente sin consentimiento.

## Sesión

Usar herramientas oficiales de Supabase para Next.js. No inventar un sistema paralelo de tokens.

## Registro público

Orientado al dueño del bazar. No permitir elección arbitraria de `SUPERADMIN`.

## Variables

Públicas:
```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

Privadas:
```text
SUPABASE_SERVICE_ROLE_KEY
TURNSTILE_SECRET_KEY
BREVO_SMTP_USER
BREVO_SMTP_PASSWORD
EFFERD_REGISTRY_TOKEN
```

## Logs

Nunca registrar passwords, OTP, access/refresh tokens, service role, SMTP password o secrets.

## Producción

Antes de producción revisar:
- HTTPS;
- redirects;
- RLS;
- rate limits;
- Attack Protection;
- SMTP;
- recuperación de contraseña;
- confirmación email;
- funciones definer;
- políticas de sesión;
- backups/migraciones.

<!-- END AUTH_SECURITY.md -->


---

<!-- BEGIN UI_DESIGN_SYSTEM.md -->

# Sistema visual — MiBazarPE

## Dirección visual

Se seleccionó Efferd como referencia principal. La intención es conservar el estilo visual y la arquitectura de los bloques elegidos, adaptándolos a MiBazarPE.

Dirección actual:
- dark-first;
- minimalista;
- tecnológica;
- sobria;
- bordes finos;
- cards;
- animaciones discretas;
- alto contraste;
- espacio negativo.

Los colores finales de marca todavía deben definirse.

## Regla visual principal

Preservar:
- layout;
- jerarquía;
- composición;
- proporciones;
- responsive;
- animaciones;
- estructura de cards;
- ritmo visual.

Modificar:
- contenido;
- textos;
- branding;
- colores;
- iconografía;
- ilustraciones;
- screenshots;
- datos.

## Bloques seleccionados

### Header
`@efferd/header-2`

### Auth
`@efferd/auth-5`

Pantalla dividida. Lado formulario para login/registro/recuperación. Lado visual con ilustración/personaje animado pendiente de definir.

No activar Google/Apple/GitHub solo porque aparezcan en el demo original; usar únicamente proveedores realmente configurados.

### Hero
`@efferd/hero-7` — Pro

### Features
`@efferd/features-6`

### Product/Dashboard Showcase
`@efferd/features-10` — Pro

### Logo Cloud
Referencia seleccionada: `@efferd/logo-cloud-11`

Usar para tecnologías/herramientas, no para afirmar alianzas comerciales. Posibles logos: Next.js, React, Supabase, PostgreSQL, Cloudflare, Brevo.

Cambiar copies tipo “Trusted by” por un mensaje honesto como “Construido con tecnologías modernas” si no existen alianzas reales.

### Integrations
`@efferd/integrations-9` — Pro

### Team
`@efferd/team-7` — Pro

Usar integrantes reales. No inventar cargos empresariales formales si no han sido definidos.

### Pricing
`@efferd/pricing-6` — Pro

El diseño está aprobado, pero los planes comerciales reales no están definidos. No inventar precios ni billing.

### Testimonials
`@efferd/testimonials-6`

No usar testimonios falsos presentados como reales. Hasta tener usuarios reales, omitir, reemplazar por casos de uso o marcar demostraciones.

### FAQ
`@efferd/faqs-6` — Pro

Temas sugeridos:
- seguridad;
- inventario;
- crédito;
- pagos;
- acceso de clientes;
- cálculo de intereses;
- disponibilidad.

### CTA
`@efferd/cta-18` — Pro

### Contact
`@efferd/contact-11` — Pro

No mostrar dirección física falsa. Si no existe oficina pública, usar contacto digital y reemplazar/omitir mapa.

### Blog
`@efferd/blogs-2`

Temas posibles:
- educación financiera;
- inventario;
- buenas prácticas para bazares;
- ventas al crédito;
- seguridad.

### Footer
`@efferd/footer-13` — Pro

### App Shell
`@efferd/app-shell-4`

Navegación interna prevista:
- Dashboard
- Ventas
- Clientes
- Productos
- Inventario
- Créditos
- Cuentas por cobrar
- Pagos
- Reportes
- Configuración

### Dashboard
`@efferd/dashboard-3`

Conservar jerarquía de KPIs, cards, gráficos, sidebar y filtros. Sustituir métricas demo por métricas reales.

KPIs posibles:
- ventas del período;
- ventas a crédito;
- saldo por cobrar;
- mora;
- clientes activos;
- productos con stock bajo;
- pagos recibidos;
- créditos activos.

## Registro Efferd

Free:

```json
{
  "registries": {
    "@efferd": "https://efferd.com/r/{style}/{name}.json"
  }
}
```

Pro:

```json
{
  "registries": {
    "@efferd": {
      "url": "https://efferd.com/r/{style}/{name}.json",
      "headers": {
        "Authorization": "Bearer ${EFFERD_REGISTRY_TOKEN}"
      }
    }
  }
}
```

Nunca guardar el token real en `components.json`.

## Orden sugerido de landing

1. Header
2. Hero
3. Logo Cloud / tecnologías
4. Features
5. Dashboard showcase
6. Integrations
7. Team
8. Pricing
9. Testimonials/casos de uso
10. FAQ
11. CTA
12. Blog
13. Contact
14. Footer

Es orden sugerido, no rígido.

## Tokens pendientes

- color primario;
- color secundario;
- accent;
- logo;
- isotipo;
- tipografía final;
- personaje/mascota;
- estilo de ilustraciones.

Hasta definirlos, centralizar colores en CSS variables/Tailwind theme y no dispersar hex arbitrarios.

## Copy

En español, claro, comercial sin exagerar, orientado a dueños de bazares y comprensible para usuarios no técnicos.

## Accesibilidad

Mantener contraste, focus visible, labels, navegación por teclado, ARIA cuando corresponda y reduced motion.

<!-- END UI_DESIGN_SYSTEM.md -->


---

<!-- BEGIN ENVIRONMENT.md -->

# Entorno y configuración

Este archivo documenta nombres, nunca valores secretos.

## Variables esperadas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
BREVO_SMTP_USER=
BREVO_SMTP_PASSWORD=
EFFERD_REGISTRY_TOKEN=
```

## Supabase Auth — desarrollo

```text
Site URL:
http://localhost:3000

Redirect:
http://localhost:3000/**
```

Producción queda pendiente de dominio real.

## Efferd

Bloques Free no requieren token. Bloques Pro requieren `EFFERD_REGISTRY_TOKEN`.

Nunca compartir el valor en chat, logs o commits.

## `.env.example`

Puede contener solo nombres vacíos. Variables privadas se documentan, no se rellenan.

## Package manager

No asumir npm/pnpm/yarn. Revisar lockfile y scripts reales. Los prompts Efferd muestran `npx` y `pnpm dlx`; usar el package manager del repo.

## Node

Usar LTS compatible con la versión real de Next.js. No fijar versión sin inspeccionar `package.json`/`.nvmrc`.

<!-- END ENVIRONMENT.md -->


---

<!-- BEGIN CURRENT_STATE.md -->

# Estado actual conocido

## Supabase

Ya se realizaron trabajos de configuración y prueba.

Estado conocido:
- proyecto Supabase creado;
- Auth habilitado;
- email/password habilitado;
- confirmación de email habilitada;
- URL local configurada;
- Turnstile seleccionado como Captcha;
- tablas principales creadas;
- RLS habilitado al menos en tablas núcleo;
- roles creados;
- funciones de registro/invitación/contexto creadas;
- inventario creado;
- motor financiero modelado parcialmente;
- datos de demostración cargados.

## Usuario de prueba

Existe al menos un usuario de prueba en Supabase Auth y un perfil vinculado. No documentar credenciales ni depender de ese usuario en código.

## Bazar de prueba

Se utilizó un bazar de demostración con configuración financiera. No hardcodear ID, RUC o nombre. Resolver bazar desde contexto de usuario o datos reales.

## Inventario

Se cargaron productos y stock de prueba. El trigger de movimientos de inventario fue verificado.

## Finanzas

Se probaron ventas, cuentas, créditos, cuotas, pagos y mora. Hubo escenarios de contado, crédito activo, cuotas pendientes, cuotas vencidas y mora acumulada.

## Diseño

Se completó la selección conceptual de bloques Efferd para landing, auth, marketing, app shell y dashboard.

## Próxima etapa inmediata

1. crear logo;
2. definir identidad visual;
3. definir colores;
4. definir personaje/mascota;
5. reunir imágenes/mockups;
6. crear o auditar frontend;
7. instalar bloques Efferd de forma controlada.

No reiniciar la base de datos desde cero.

<!-- END CURRENT_STATE.md -->


---

<!-- BEGIN ROADMAP.md -->

# Roadmap de implementación

## Fase 0 — Contexto y auditoría
- entregar este paquete a Codex;
- leer documentación;
- auditar repo;
- auditar Supabase;
- detectar discrepancias;
- no hacer cambios destructivos.

## Fase 1 — Identidad visual
- logo;
- isotipo;
- paleta;
- tipografía;
- mascota/personaje;
- assets;
- screenshots/mockups.

## Fase 2 — Bootstrap frontend
- Next.js;
- TypeScript;
- Tailwind;
- shadcn/ui;
- Supabase;
- estructura de rutas;
- variables;
- lint/typecheck.

## Fase 3 — Sistema visual base
- header;
- hero;
- footer;
- auth shell;
- app shell;
- tokens.

## Fase 4 — Landing
- Hero
- Features
- Dashboard showcase
- Tecnologías/Logo Cloud
- Integrations
- Team
- Pricing
- Testimonials/casos de uso
- FAQ
- CTA
- Blog
- Contact
- Footer

No usar datos ficticios como si fueran reales.

## Fase 5 — Auth
- login;
- registro dueño;
- confirmación;
- forgot/reset;
- Turnstile;
- callback;
- logout;
- sesión;
- perfil.

## Fase 6 — Contexto de bazar
- obtener contexto;
- rol;
- bazar;
- rutas protegidas;
- navegación por permisos.

## Fase 7 — Clientes
- listado;
- alta;
- edición;
- estado;
- invitación;
- vinculación;
- línea de crédito.

## Fase 8 — Productos e inventario
- catálogo;
- filtros;
- CRUD;
- stock;
- entradas/salidas;
- kardex;
- alertas;
- usar trigger/RPC existente.

## Fase 9 — Ventas
- ítems;
- cliente;
- stock;
- contado/crédito;
- límite;
- persistencia transaccional.

## Fase 10 — Créditos
- configuración financiera;
- tasa;
- gracia;
- cronograma;
- método francés;
- detalle de crédito.

## Fase 11 — Pagos
- registrar;
- aplicar mora;
- interés;
- capital;
- actualizar cuotas/crédito/cuenta;
- consistencia transaccional.

## Fase 12 — Dashboard
- ventas;
- créditos;
- cobranza;
- mora;
- clientes;
- stock bajo;
- ingresos;
- cartera.

## Fase 13 — Reportes
- ventas por período;
- cuentas por cobrar;
- créditos;
- mora;
- inventario;
- movimientos;
- stock bajo.

## Fase 14 — Hardening
- RLS;
- SECURITY DEFINER;
- validación;
- errores;
- rate limits;
- captcha;
- headers;
- testing.

## Fase 15 — QA financiero
Casos de prueba para:
- equivalencia de tasas;
- tasa diaria;
- tasa mensual;
- gracia;
- cuota francesa;
- mora;
- última cuota;
- fin de mes;
- pagos según modelo final.

Comparar con resultados manuales del curso.

## Fase 16 — Deploy
- dominio;
- URLs Supabase;
- variables producción;
- SMTP;
- Turnstile;
- build;
- migrations;
- smoke tests;
- observabilidad.

No avanzar a créditos complejos antes de estabilizar auth, contexto bazar, clientes, productos y ventas base.

<!-- END ROADMAP.md -->


---

<!-- BEGIN UNRESOLVED_QUESTIONS.md -->

# Decisiones pendientes e inconsistencias

Codex no debe decidir unilateralmente estos puntos.

## Identidad visual
Pendientes: logo, isotipo, colores, tipografía, personaje/mascota.

## Pricing
El diseño `pricing-6` fue seleccionado, pero no están definidos precios reales, modelo comercial, límites por plan ni billing. No implementar cobros todavía.

## Testimonials
No existen testimonios reales confirmados. No publicar testimonios falsos.

## Logo Cloud
Debe comunicar tecnologías utilizadas, no alianzas o clientes.

## Contact
No existe una dirección física pública definida. No inventar una ubicación para el mapa.

## Astro
El usuario conoce Astro, pero para MiBazarPE se definió Next.js como framework principal. No introducir Astro salvo decisión posterior.

## Precio contado vs crédito
El PDF académico usa `precio_contado` y `precio_credito`; la tabla real observada usa `precio_venta` y `permite_venta_credito`.

Debe decidirse si:
- hay un solo precio;
- existe recargo;
- las condiciones se derivan por interés;
- o se requieren dos precios.

No modificar esquema hasta decidir.

## IDs
El documento académico muestra algunos IDs como INTEGER. La base real usa UUID. La implementación debe seguir el esquema real.

## Política exacta de password
Objetivo: mínimo 10 y robusta. Confirmar configuración guardada en Supabase antes de reflejar requisitos exactos en UI.

## Motor financiero
Auditar qué fórmulas ya existen en PostgreSQL y cuáles están pendientes. No reimplementar todo desde cero.

## RLS de tablas financieras
Comprobar estado exacto de:
- clientes;
- productos;
- movimientos;
- ventas;
- cuentas;
- créditos;
- cuotas;
- pagos;
- aplicaciones.

## Esquema capturado parcialmente
Algunas tablas se inspeccionaron solo en pantalla. Antes de programar consultar `information_schema`, constraints, indexes, triggers, policies y routines.

## Contenido de Blog
Aún no definido.

## Datos actuales
Mayormente de prueba. No tratarlos como métricas reales.

## Dominio y despliegue
Pendientes. No cerrar infraestructura hasta decidir proveedor y dominio.

<!-- END UNRESOLVED_QUESTIONS.md -->


---

<!-- BEGIN REFERENCES.md -->

# Referencias y fuentes internas

## Documento base
- `TP-Finanzas (2).pdf`

Contiene introducción, definiciones, marco legal, marco teórico, datos de entrada/salida/intermedios, fórmulas financieras, diseño conceptual y equipo.

## Fuentes citadas por el propio documento
El PDF menciona, entre otras:
- Ley N.º 26702;
- Resolución SBS N.º 8181-2012;
- Ley N.º 29733;
- Código Civil, art. 1242;
- Senmache Sarmiento (2012);
- Valera Moreno (2012);
- Bodie & Merton (2003);
- Aliaga Valdez & Aliaga Calderón (2022);
- Schwaber & Sutherland (2020);
- ISO/IEC 25010 (2023).

La página de bibliografía no contiene texto recuperable suficiente para reconstruir todas las referencias completas con seguridad. No inventar datos bibliográficos faltantes.

## UI Efferd
- `@efferd/header-2`
- `@efferd/auth-5`
- `@efferd/features-6`
- `@efferd/features-10`
- `@efferd/hero-7`
- `@efferd/footer-13`
- `@efferd/team-7`
- `@efferd/pricing-6`
- `@efferd/testimonials-6`
- `@efferd/logo-cloud-11`
- `@efferd/faqs-6`
- `@efferd/integrations-9`
- `@efferd/cta-18`
- `@efferd/contact-11`
- `@efferd/blogs-2`
- `@efferd/app-shell-4`
- `@efferd/dashboard-3`

## Infraestructura seleccionada
- Supabase
- PostgreSQL
- Supabase Auth
- Cloudflare Turnstile
- Brevo SMTP
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

<!-- END REFERENCES.md -->


---

<!-- BEGIN IMPLEMENTATION_CHECKLIST.md -->

# Checklist de implementación

## Antes de tocar código
- [ ] Leer `AGENTS.md`
- [ ] Leer documentación completa
- [ ] Revisar repo
- [ ] Revisar package manager
- [ ] Revisar Next.js version
- [ ] Revisar `components.json`
- [ ] Revisar Supabase helpers
- [ ] Revisar env names
- [ ] Revisar DB real
- [ ] Reportar discrepancias

## Frontend base
- [ ] TypeScript strict
- [ ] Tailwind
- [ ] shadcn
- [ ] tokens
- [ ] fonts
- [ ] layouts
- [ ] error/loading states
- [ ] responsive

## Landing
- [ ] header-2
- [ ] hero-7
- [ ] logo-cloud-11
- [ ] features-6
- [ ] features-10
- [ ] integrations-9
- [ ] team-7
- [ ] pricing-6
- [ ] testimonials-6 o reemplazo honesto
- [ ] faqs-6
- [ ] cta-18
- [ ] blogs-2
- [ ] contact-11
- [ ] footer-13

## Auth
- [ ] auth-5
- [ ] registro
- [ ] login
- [ ] confirmación email
- [ ] forgot/reset
- [ ] Turnstile
- [ ] session middleware
- [ ] logout
- [ ] perfil
- [ ] errores

## App
- [ ] app-shell-4
- [ ] dashboard-3
- [ ] rol
- [ ] bazar context
- [ ] protected routes
- [ ] menu dinámico

## Dominio
- [ ] clientes
- [ ] productos
- [ ] inventario
- [ ] ventas
- [ ] créditos
- [ ] pagos
- [ ] reportes

## Calidad
- [ ] lint
- [ ] typecheck
- [ ] unit tests
- [ ] integration tests
- [ ] build
- [ ] responsive
- [ ] accessibility
- [ ] RLS audit
- [ ] auth test
- [ ] finance test

<!-- END IMPLEMENTATION_CHECKLIST.md -->


---

<!-- BEGIN CODEX_START_PROMPT.md -->

# Prompt inicial para Codex

Copia y pega lo siguiente como primer mensaje en Codex:

---

Estamos comenzando/continuando el desarrollo de **MiBazarPE**.

Antes de escribir o modificar cualquier código:

1. Lee completamente `AGENTS.md`.
2. Lee `SOURCE_OF_TRUTH.md`.
3. Lee todos los documentos Markdown del paquete de contexto.
4. Examina la estructura actual del repositorio.
5. Revisa `package.json`, lockfile, `components.json`, configuración Tailwind y variables documentadas.
6. Identifica si el proyecto ya es Next.js/shadcn.
7. No instales nada todavía.
8. No modifiques ningún archivo todavía.
9. No cambies la base de datos.
10. No inventes tablas, columnas, RPCs, rutas o reglas.
11. Si tienes acceso al esquema de Supabase, compáralo con `DATABASE.md`; si no, indica exactamente qué información necesitas.

Después de leer y auditar, entrégame únicamente:

- tu comprensión de MiBazarPE;
- estado actual del repositorio;
- stack detectado;
- arquitectura;
- módulos funcionales;
- base de datos existente;
- autenticación y seguridad;
- reglas financieras críticas;
- sistema visual Efferd seleccionado;
- dependencias externas;
- inconsistencias;
- riesgos técnicos;
- orden recomendado de implementación.

No empieces a implementar hasta que yo apruebe tu diagnóstico.

---

<!-- END CODEX_START_PROMPT.md -->

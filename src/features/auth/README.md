# Auth de MiBazarPE

## Origen visual

Bloque original `@efferd/auth-5`, instalado desde el registry público oficial
`https://efferd.com/r/radix-nova/auth-5.json` (Auth 5 es Free).
Se conserva la composición de Auth 5 con el reparto aprobado de 40%/60% desde
1024 px, marca superior, texto inferior, curvas decorativas y primitivas InputGroup.
El formulario tiene un máximo de 400 px y queda centrado dentro del panel derecho.
El panel izquierdo conserva altura y geometría entre Login y Registro. Los errores
largos desplazan solo el contenido derecho; su scrollbar tiene espacio reservado.
El botón existente del proyecto no se sobrescribió. El registry configurado se conserva.

Rutas: `/login`, `/registro`, `/recuperar-contrasena`, `/actualizar-contrasena`.
Los enlaces de la landing ya apuntaban a las dos primeras rutas.

## Supabase

Se reutiliza el proyecto remoto existente `mibazarpe`. El repositorio no tenía clientes
Supabase ni rutas Auth implementadas; se agregó una única integración `@supabase/ssr`
con cliente de navegador, cliente servidor y proxy de renovación limitado a Auth.
Solo se utilizan URL y clave pública desde variables de entorno. No se utiliza service role.

`service.ts` centraliza signInWithPassword, signUp, recuperación, cambio de contraseña
y cierre local de sesión. La pantalla escucha los cambios de sesión de Supabase y
limpia el estado de éxito y las contraseñas al recibir un cierre de sesión, incluido
el iniciado desde otra pestaña. El listener se cancela al desmontar la pantalla.
Esta sincronización es de presentación; no sustituye la autorización del servidor/RLS.
`/auth/callback` intercambia el código PKCE y restringe el
destino a Login o cambio de contraseña. No hay proveedores OAuth habilitados en la UI.
El éxito conserva la sesión y ofrece volver al inicio; no se construye un Dashboard.

Variables: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(compatible con `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Turnstile se renderiza solo cuando
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` está configurada; Supabase debe tener configurado el
mismo proveedor. La allowlist de Auth debe aceptar el callback del dominio usado.

### Diferencias verificadas con el contexto anterior (2026-10-09)

- El proyecto remoto estaba pausado y se reactivó para esta integración.
- Auth permite email/password y registro; `mailer_autoconfirm` está activado. El código
  también contempla el caso sin sesión que requiere confirmación por correo, pero no
  modifica esa configuración remota ni afirma que esté activada actualmente.
- `public.perfiles` exige `id`, `nombre_completo`, `tipo_documento`, `numero_documento`
  y `rol`. No se encontraron los triggers de alta ni las RPC `registrar_bazar_propio`
  y `obtener_contexto_usuario` descritos en el paquete de contexto.
- El registro de esta etapa crea exclusivamente la identidad Supabase Auth y guarda
  `nombre_completo` como metadata de presentación. No asigna roles desde metadata,
  no inserta perfiles incompletos y no crea bazares. Completar el onboarding comercial
  requiere reconciliar el esquema con la arquitectura antes de implementar módulos privados.

## Bazi intercambiable

`src/components/auth/auth-mascot.tsx` recibe `mode` y `state`; las rutas de los assets
están centralizadas allí. Login usa `Bazi_saludo_animado.webm` y Registro
`Bazi_celebracion_animada.webm`. Los originales de `assets/bazi/05_modelo_2d/v004/`
se copiaron a `public/brand/bazi/` sin modificar; los hashes de los seis archivos
WebM/MP4/GIF coinciden con sus fuentes. El vídeo ocupa una caja cuadrada reservada
con `object-fit: contain`, sin recorte ni deformación, autoplay, loop, muted y playsInline.

Estados disponibles: idle, email, password, password-visible, loading, success, error.
El renderer selecciona saludo normalmente y celebración para Registro/éxito; los
estados restantes mantienen preparada la interfaz para futuras poses. Ante error de
WebM se intenta MP4; ante error de ambos, GIF; el PNG es el último respaldo estático.
Con movimiento reducido se muestra el PNG y las líneas quedan estáticas. Los vídeos
se pausan con la pestaña oculta y no se montan por debajo de 1024 px.

Los vídeos originales tienen un fondo azul oscuro casi opaco. El panel usa un tono
compatible con ese fondo; no se aplican chroma key, máscaras, filtros ni edición de
los archivos. Las curvas recorren la zona inferior para evitar cortes visibles del
fondo del vídeo. `FloatingPaths` usa SVG con animaciones CSS de transform/opacity
de 28 y 36 segundos, sin Motion, blur ni grandes capas de composición.

## Comprobaciones

`npm run typecheck`, `npx eslint src tests/auth.test.mjs tests/auth-service.test.mjs`,
`node --experimental-strip-types --experimental-test-module-mocks --test tests/auth.test.mjs tests/auth-service.test.mjs`
y `npm run build`.
El lint global también incluye experimentos y librerías vendor anteriores en `assets/bazi`;
sus errores no corresponden a esta implementación.

La conexión real se comprueba con un intento inválido, sin crear cuentas ni enviar correos.
Un alta exitosa, la recepción del email y el cambio de contraseña necesitan una cuenta/correo
controlados para validación integral; no se consideran comprobados por una respuesta de error.

### Continuación y validación del 2026-10-09

- 12 pruebas aprobadas: validación, traducción de errores y servicio Auth. Las pruebas
  del servicio usan un cliente simulado; cubren registro con/sin sesión, duplicado
  oculto, metadata sin roles, callback de recuperación, cambio de contraseña con
  usuario validado, logout local y notificaciones de sesión con cancelación del listener.
- Lint de `src` y las pruebas Auth, TypeScript y build de producción aprobados.
- Chrome: Login vacío, rechazo real de credenciales ficticias por Supabase, Registro
  vacío con foco en el primer error, Registro en escritorio y móvil, y pantalla de
  cambio de contraseña bloqueada sin sesión. Se conserva la composición del registry
  oficial `auth-5` y el formulario de 384 px en escritorio.
- Las cuatro rutas Auth responden HTTP 200. El callback sin código o con código
  inválido vuelve a Login; no acepta un destino externo. Login, Registro y callback
  sirven `Cache-Control: private, no-store` en el servidor de producción local.
- Supabase sigue activo; email/password y registro habilitados, autoconfirmación
  activada. `perfiles`, `usuarios_bazar` y `bazares` tienen RLS habilitado pero no se
  encontraron policies para esas tablas, ni triggers de alta en `auth.users`, ni
  las RPC `registrar_bazar_propio`/`obtener_contexto_usuario`.
- `.env.local` tiene URL y clave pública de Supabase; no contiene la site key de
  Turnstile. El widget no se ha validado contra el proveedor real.
- Pendientes de una cuenta controlada: alta real, acceso exitoso, persistencia tras
  recarga, cierre entre pestañas y flujo de correo/recuperación completo. El listener
  de sesión se probó con eventos simulados, no con dos sesiones reales.
- No se modificó el esquema remoto ni se ejecutó Git. Se verificaron hashes de 41
  archivos de landing, layout, estilos globales y manifiestos de dependencias sin cambios.

### Revisión visual 40/60

Validación real en Chrome a 1920×1080, 1440×900, 1366×768, 1024×768,
768×1024 y 390×844, en Login y Registro. En desktop el ancho del formulario es
400 px. El reparto medido es 768/1152, 576/864, 546.39/819.61 y 409.59/614.41 px,
respectivamente. No se detectó overflow horizontal. En tablet/móvil se oculta
el panel decorativo y se mantiene el logo sobre el formulario. Registro móvil
permite scroll vertical para mantener todos los campos y enlaces accesibles.

Se comprobaron alternancia entre rutas, recarga, formulario vacío, contraseña
visible/oculta, confirmación que no coincide, recuperación sin correo y rechazo
real de credenciales ficticias por Supabase. La posición y caja de Bazi coinciden
entre Login/Registro y permanecen iguales al mostrar errores. El código del
servicio Auth, callback, proxy y clientes Supabase permanece intacto.

Se comprobó el WebM reproduciéndose (`readyState=4`, `paused=false`, tiempo en
avance), MP4 bloqueando solo WebM, y GIF bloqueando ambos vídeos en Chrome.
Los bloqueos temporales de red fueron retirados. Con reduced motion: cero vídeos
montados, PNG visible y `animation-name: none` en ambas familias de líneas.

Autofill: se forzó la pseudoclase nativa `autofill` mediante DevTools con un correo
ficticio; se comprobó el fondo oscuro, texto legible, borde y focus ring. No se
utilizó una contraseña guardada ni se guardaron nuevas credenciales en Chrome.

Diagnóstico de los rectángulos: antes del cambio, la captura convencional omitió
contenido que el DOM mostraba como visible/cargado, mientras una captura directa
de la superficie de Chrome lo mostró correctamente. Esto evidencia un artefacto
de captura/composición en esa reproducción; no demuestra una causa única para
todas las capturas anteriores. Se retiraron las tres capas decorativas de 1280 px,
sus desplazamientos, z-index negativo y `contain: strict`; el sombreado derecho
se pinta ahora como fondo del propio panel. Las capturas directas finales no
muestran rectángulos superpuestos. No se elevó arbitrariamente el z-index.

Google: `/auth/v1/settings` del proyecto existente devuelve `external.google=false`.
El botón está preparado visualmente, deshabilitado y rotulado «Próximamente».
No se activó OAuth ni se modificó Supabase. No se puede deducir de ese endpoint
si hay credenciales guardadas detrás del proveedor deshabilitado.

Para habilitarlo: configurar un cliente OAuth Web en Google Auth Platform,
consentimiento y scopes openid/email/profile; origen local `http://localhost:3000`;
URI autorizada de Google `https://juiygtydkwflnwapkqsx.supabase.co/auth/v1/callback`;
guardar Client ID/Secret y habilitar Google en Supabase; verificar la allowlist para
`http://localhost:3000/auth/callback`. Después conectar el botón mediante
`signInWithOAuth` y el callback PKCE existente. No guardar secretos en el frontend.
Fuente: https://supabase.com/docs/guides/auth/social-login/auth-google

No se probó un alta nueva, una sesión exitosa ni entrega de correo con una cuenta
controlada. Las 12 pruebas automatizadas incluyen simulaciones del servicio y no
sustituyen esas pruebas de extremo a extremo. Se verificaron 50 archivos protegidos
sin cambios, incluidos landing, estilos globales, dependencias y lógica Auth.

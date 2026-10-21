# Bazi integrado — configuración y alcance

Estado comprobado el 21 de octubre de 2026. La implementación está en `/bazi` y utiliza Google Gemini con herramientas autorizadas del servidor y la sesión existente de Supabase.

## Configuración privada

El entorno local ya tiene `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash-lite` y `BAZI_ACTION_SECRET`. Los valores secretos están en `.env.local`, no en este documento ni en variables `NEXT_PUBLIC_`. Al desplegar, configurar estos nombres en el administrador de secretos del alojamiento. Las variables privadas se leen únicamente en el servidor.

Se reutilizó la clave existente de Google AI Studio, cuyo proyecto mostraba nivel gratuito. No se configuró facturación. Cada ronda de herramientas consume una solicitud adicional de Gemini y está sujeta a la cuota y disponibilidad de Google. El cliente nativo usa Interactions API, `store:false`, cuatro rondas como máximo, seis herramientas y un tiempo total de hasta cuarenta y cinco segundos. `store:false` evita guardar el objeto Interaction; el tratamiento general de los datos sigue las condiciones del proveedor.

## Activación y conversaciones

El primer envío abre un diálogo que explica qué consulta, contexto y resultados necesarios se enviarán a Google Gemini. Al aceptar, continúa con el mensaje ya escrito. Se puede recordar la elección para la misma cuenta y negocio, y pausarla desde el cuadro del mensaje.

El historial, las preferencias, los estados de propuestas y la actividad se guardan en `bazi_espacios`. Se conservan hasta doce conversaciones, los veinte últimos intercambios por conversación y ochenta eventos de actividad, con un límite de tamaño aproximado de 470 KB. Si dos pestañas intentan guardar versiones distintas, se informa el conflicto en vez de sobrescribir silenciosamente el historial. Copiar cualquier contenido no guardado antes de recargar.

Las propuestas históricas se conservan como detalle de consulta. Los tokens de confirmación y el cronograma ejecutable no se guardan en el historial; después de recargar, preparar la propuesta nuevamente para revisar datos actuales. Las propuestas nuevas caducan a los diez minutos. La actividad guardada es un historial del espacio personal; no sustituye la auditoría contable existente.

## Consultas y operaciones

- Resumen de hoy, ventas mensuales, inventario, stock bajo y próximos ocho compromisos, con períodos y origen DEMO visibles.
- Búsqueda de productos y clientes del negocio activo, sin documentos ni contactos personales para el modelo.
- Propuesta de precio contado, precio crédito o stock mínimo. La confirmación compara atómicamente los valores revisados y `updated_at`; no cambia las existencias ni operaciones históricas.
- Previsualización y confirmación de ventas de hasta cinco productos mediante el motor ya existente y su idempotencia.
- Propuestas de rutinas y de notas de memoria. Las herramientas del modelo no guardan estas propuestas por sí mismas: el usuario las confirma desde la tarjeta.

Cada acción vuelve a comprobar sesión, rol y pertenencia. El cliente solo consulta su cuenta vinculada y prepara rutinas de sus propias cuotas; no recibe herramientas comerciales ni memoria compartida. Bazi toma la primera cuenta activa vinculada a ese cliente; las otras cuentas siguen disponibles en el portal existente. Propietario y Superadministrador trabajan con el negocio activo, según su acceso vigente.

## Rutinas persistentes

Desde la pestaña Rutinas o desde una petición a Bazi se puede preparar un resumen diario o semanal. El horario es `America/Lima`. Los tipos habilitados son stock bajo/agotados y vencimientos de cobros/pagos para gestores, o cuotas propias para clientes. Se revisa el horario antes de confirmar. Los controles permiten ejecutar ahora, editar, pausar, reanudar, archivar y restaurar.

Los resultados quedan en `bazi_ejecuciones`. Los importes de monedas diferentes se mantienen separados. Vencimientos incluye saldos vencidos y hasta siete días futuros; cada resultado muestra su fecha. Las rutinas no envían correos, WhatsApp ni mensajes externos; tampoco registran ventas, pagos, transferencias o movimientos de stock y no consumen consultas de Gemini.

El trabajo de Supabase Cron `mibazar-bazi-resumenes` revisa cada minuto las rutinas vencidas, procesa hasta veinticinco con bloqueo de filas y evita duplicados por rutina/fecha. El trabajador está en esquema privado y no es ejecutable por `anon`, `authenticated` ni `service_role`. Vuelve a comprobar perfil activo, negocio activo y acceso de su creador. Si el acceso ya no es válido, pausa la rutina. Las ejecuciones fallidas muestran un aviso sanitizado; se puede ejecutar manualmente o esperar el siguiente horario. Si se omiten horarios durante una interrupción, prepara un resumen al recuperar servicio y avanza al siguiente horario futuro.

Las confirmaciones de nuevas rutinas y notas llevan IDs estables para que un reintento de la misma propuesta no genere duplicados. No hay rutinas comerciales activadas automáticamente al instalar el módulo.

## Memoria y correcciones

Los gestores pueden aprobar notas de contexto, editarlas, archivarlas y restaurarlas. El botón Corregir y recordar ayuda a preparar una corrección para revisar. Las notas de `bazi_memoria` se separan por negocio y solo están disponibles para quienes pueden gestionarlo; los clientes no las leen ni editan.

La herramienta de recuperación busca entre las treinta notas activas más recientes y entrega hasta cinco notas relevantes. Es recuperación por palabras y recencia, no un índice vectorial. El modelo recibe las notas como contexto del usuario, sin autoridad para sustituir reglas financieras, permisos o cifras consultadas en vivo.

Este aprendizaje consiste en memoria aprobada y recuperable, no en modificar los pesos de Gemini. Google indica que el ajuste fino no está disponible en Gemini API/AI Studio; requiere un servicio de Google diferente. No se ha simulado un entrenamiento inexistente.

## Verificación

- 104 pruebas automáticas: autorización por rol y contexto, normalización del historial, límites, token no persistente, propuestas sin escritura, firma y caducidad, idempotencia, memoria y rutinas del cliente, y conflicto de versión.
- Tipos, revisión de estilo de los archivos de Bazi y compilación de producción: correctos.
- Pruebas SQL bajo los tres roles existentes: aislamiento de usuarios, cliente sin memoria comercial, límites por tipo de rutina, CAS, idempotencia, ejecución manual, ejecución programada, avance de horario, trabajador privado y hora de Lima. Las escrituras de ensayo se revirtieron al finalizar la transacción.
- Supabase Cron registra ejecuciones correctas del trabajador. Las cuatro tablas nuevas tienen RLS. El asesor de seguridad devuelve la misma alerta previa sobre protección de contraseñas filtradas, sin nuevas alertas por Bazi.
- Navegador con Superadministrador en DEMO: activación en el primer envío, respuesta real de Gemini, historial y elección de Gemini tras recargar, ventas, propuestas de producto, memoria y rutinas sin confirmación automática. Las cuentas de propietario y cliente se verificaron a nivel SQL y mediante pruebas automatizadas; no se inició sesión en el navegador con sus credenciales.
- Con autorización específica del usuario se creó desde el navegador la rutina «Prueba de resumen de stock» en DEMO · Bazar 1, diaria a las 09:00 de Lima. Se ejecutó una vez el 21/10/2026 a las 17:20, guardó 80 productos activos, 8 agotados y 8 con stock bajo, y se dejó pausada. Tras recargar se verificaron el estado Pausada y el mismo resultado guardado. La prueba no envió mensajes ni modificó ventas, stock o pagos.

## Archivos de base de datos

- `20261021213843_bazi_persistent_workspace_and_routines.sql`: estado, memoria, rutinas, resultados, RLS y programador.
- `20261021214644_bazi_idempotent_routine_confirmations.sql`: confirmación idempotente de rutinas.

No se modificaron tablas ni políticas comerciales existentes, no se insertaron ventas ni se cambiaron saldos o productos como parte de la verificación. No se ejecutaron operaciones Git.

Referencias oficiales: [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview), [herramientas Gemini](https://ai.google.dev/gemini-api/docs/function-calling), [ajuste fino Gemini](https://ai.google.dev/gemini-api/docs/model-tuning), [Supabase Cron](https://supabase.com/docs/guides/cron), [seguridad de contraseñas Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

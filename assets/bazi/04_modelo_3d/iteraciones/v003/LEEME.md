# Bazi v003 — estudio visual en Blender

Archivo principal: Bazi_v003.blend. La escena activa es "BAZI v003 | Revision de parecido".
Se conserva la escena inicial "Scene", con la cámara y luz que estaban abiertas antes del trabajo.
No se modificó Bazi_Master.blend ni v001/v002, ni los originales PNG.

## Revisión
- En Blender: ilustración BASE a la izquierda, modelo 3D en el centro y referencia SALUDO a la derecha.
- Girar la vista con el botón central del mouse. Numpad 1 regresa a la vista frontal.
- En revision.html: frente, tres cuartos, perfil, cambio de fondo y superposición del original.
- frontal.png, tres_cuartos.png y lateral.png se renderizaron con Cycles. Son vistas fijas.

## Diseño y cambios
Referencia principal: 01_conceptos/02_bazi_pose_base.png.
Referencia para acciones futuras: 02_bocetos_funcionales/08_bazi_saludando.png.
Guías 10-14 no se utilizaron para modelar: representan otro personaje.
Cabeza de mejillas anchas, ojos negros con iris azul, orejas en cuenco, nariz pequeña, sonrisa y sudadera.
Mangas completas del hombro al puño. Manos con pulgar unido. Pelvis, piernas y pies unidos mediante remallado.
Mechones unidos a la cabeza. El pelaje de curvas se limita a superficies blancas; interior azul de las orejas sin fibras blancas.
Se reconstruyó el pequeño bordado del pecho como aproximación geométrica. No sustituye al logo oficial.

## Estado y límites
Estudio de parecido pendiente de revisión por James.
SIN esqueleto, pesos, acciones, transiciones ni prueba en React Three Fiber.
No es una entrega de bazi.glb y no se debe usar todavía en el login.
El acabado del rostro, mechón, ropa y pies requiere refinamiento artístico.
Profundidad y espalda/mochila inferidas a partir de una vista frontal. Necesitan revisión.
El pelaje usa curvas para esta revisión de Blender: requiere una solución compatible y ligera para glTF/WebGL.
La topología remallada requiere preparación para deformación antes del rig.
No se utilizó un generador externo ni se consumieron créditos. No se modificó React ni se ejecutó Git.

## Continuación
Corregir primero el parecido en reposo.
Después preparar topología, rig de cuerpo y controles faciales.
Construir movimientos completos con entradas y salidas, incluyendo cambios de gesto desde la postura actual.
Validar deformaciones y exportación GLB en un visor web aislado antes de integrar al login.
La referencia de saludo se usa como destino artístico, no como garantía de coincidencia exacta de esta versión.

## Reproducción
Los scripts de esta carpeta documentan la construcción local:
construir_bazi.py -> refinar_bazi.py -> ajustar_acabado.py -> refinar_detalles.py.
Ejecutar en Blender solo en una carpeta/iteración NUEVA; construir_bazi.py se detiene si el .blend ya existe.
renderizar_revision.py renderiza vistas y no guarda cambios al modelo.
Las llamadas en vivo se enviaron por MCP; su modo seguro requiere imports y operaciones de Blender permitidas.


# Bazi · v004 · acciones animadas

Esta versión devuelve movimiento a Bazi. V003 conservaba los bocetos, pero solo cambiaba entre imágenes; no ejecutaba acciones. V004 anima una superficie continua que utiliza la ilustración completa como textura. No separa manos, puños o mangas ni superpone rostros reconstruidos.

## Abrir y reproducir

Abre `revision.html` conservando `mesh-motion.js` y `player.js` junto a él. El saludo empieza automáticamente y se repite. Cada ciclo dura aproximadamente 2.6 segundos y mantiene el boceto final durante una pausa breve antes de repetirse.

- **Saludar:** mueve la pata abierta y el antebrazo, con un movimiento menor de la otra mano y la cabeza.
- **Pensar:** inclina la cabeza y acompaña ligeramente la mano del mentón.
- **Preocupación:** mueve suavemente la cabeza y las manos, conservando la expresión del boceto.
- **Celebrar:** hace pequeños saltos y mueve los brazos elevados.
- **Señalar / Proteger:** mueve el brazo correspondiente a su boceto.
- **Respirar:** movimiento suave sobre la pose base.
- **Pasos:** alterna las piernas y los brazos sobre la pose base, en el sitio.
- **Hablar:** movimiento rítmico de boca y cabeza sobre el boceto de saludo. No reproduce voz ni utiliza sincronización con audio.

**Pausar / Continuar** conserva el punto del movimiento. **Repetir acción** reinicia el ciclo. **Ver pose final** detiene el ciclo en el boceto original. **Repetir continuamente** puede desactivarse para ver una sola ejecución. La velocidad puede ajustarse a 0.5×, 1× o 2×.

El control de avance permite inspeccionar cualquier cuadro entre 0% y 100%. Al usarlo se pausa la animación. El 100% muestra directamente el PNG original completo, sin deformación. La comparación al lado utiliza el mismo original.

**Guardar vídeo** descarga una ejecución en WebM, a 512×512, con fondo azul. Los controles se bloquean brevemente durante la grabación y se restauran después. Se incluye una muestra del saludo en WebM y MP4.

Los campos de correo y contraseña activan sus acciones al recibir el foco. El guardián utiliza el boceto 07, con guiño y la mano al frente; no es una pose de cubrirse los ojos. No se envían ni guardan datos de esos campos.

## Cómo se conserva la ilustración

Una malla conectada de 72×72 celdas desplaza zonas del PNG con influencia suave alrededor de las articulaciones. Los triángulos adyacentes comparten los mismos vértices. Cada mano y su manga pertenecen a la misma superficie; no existen recortes independientes que puedan separarse.

La intensidad del movimiento llega a cero al inicio y al final de cada acción. En esos extremos el visor muestra directamente el PNG original. Los bytes de los archivos originales no se modifican.

## Límites reales

- Es animación 2D por deformación suave dentro de cada boceto; no un personaje 3D ni un rig con anatomía reconstruida.
- Al seleccionar otro boceto, cambia la pose y comienza su acción. **Todavía no se anima el recorrido anatómico completo desde reposo hacia una pose distinta.**
- Los movimientos son deliberadamente moderados para preservar la ilustración y evitar pliegues de la superficie. El diseño y las articulaciones visuales necesitan revisión de James en movimiento.
- Pasos utiliza la pose base y no es una caminata en perspectiva. Hablar no añade audio. No hay dibujos específicos para esas dos acciones entre las fuentes actuales.
- No se añade parpadeo independiente a todas las expresiones ni flexión separada de cada dedo.
- Los bordes y residuos de transparencia de los PNG originales permanecen sin retoque.
- El visor necesita WebGL. Si no está disponible, muestra la ilustración y comunica que no puede animarla. La preferencia de movimiento reducido muestra directamente la pose final. La reproducción se suspende al ocultar la pestaña.
- El HTML incrusta siete ilustraciones completas y ronda 11 MB; todavía necesita optimización antes de su futura integración al producto.

## Verificación y alcance

`verificacion_malla.json` comprueba movimiento en las nueve acciones, coordenadas finitas, ausencia de triángulos invertidos en los cuadros muestreados y coincidencia con la geometría original al inicio y al final. Esto no reemplaza la inspección visual.

`capturas/` contiene cuadros intermedios revisados en el navegador. `verificacion_fuentes.json` compara las siete ilustraciones incrustadas y los 16 assets originales con sus huellas previas. `verificacion_video.json` comprueba que la muestra del saludo contiene cuadros diferentes.

Todo queda dentro de los assets de Bazi. No se modificaron la landing, componentes React ni los originales, y no se ejecutaron operaciones de Git. Las versiones anteriores permanecen como ensayos.

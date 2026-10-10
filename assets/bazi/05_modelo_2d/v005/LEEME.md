# Bazi · v005 · entradas y salidas de gestos

Es una revisión de animación 2D para navegador. No utiliza Blender ni React Three Fiber. El visor está separado de la aplicación y no modifica el login o la landing.

## Qué cambió

V004 animaba cada boceto, pero seleccionaba otra pose inmediatamente. V005 agrega cuadros dibujados entre reposo y seis gestos: saludar, pensar, preocupación, celebrar, señalar correo y proteger contraseña. Cada secuencia se reproduce hacia delante para entrar y hacia atrás para salir. Entre dos gestos distintos, Bazi vuelve a reposo antes de entrar al siguiente. Pasos utiliza la pose de reposo; hablar utiliza saludo y conserva su movimiento rítmico sin audio.

Una entrada o salida completa dura 650 ms a velocidad normal. Dos gestos distintos requieren hasta 1.3 s de recorrido más 160 ms para cerrar el movimiento que estaba haciendo. Si eliges otro gesto durante una transición, sale desde el cuadro actual. Si cambia el destino mientras todavía está saliendo, continúa esa salida. Se puede pausar, retomar y revisar cualquier punto de la transición.

Los cuadros intermedios son ilustraciones nuevas generadas a partir de los PNG originales mediante la herramienta integrada de imágenes. El visor muestra un solo dibujo por cuadro: no mezcla dos bocas o dos brazos ni usa la deformación de superficie del ensayo descartado. Los originales completos son los extremos del recorrido y de cada acción. La animación posterior a la llegada conserva la malla suave de v004.

## Revisar

Abre `revision.html` junto a sus archivos y la carpeta `transiciones`. En el servidor local de esta sesión: http://127.0.0.1:8767/05_modelo_2d/v005/revision.html.

- Cambia entre botones para ver salida, reposo y entrada.
- **Ver secuencia completa** recorre los nueve estados y sus cambios.
- **Repetir cambio** repite la última transición.
- **Recorrer el cambio cuadro por cuadro** permite examinar las posiciones intermedias. El 100% muestra el PNG original de destino.
- El otro control revisa el movimiento dentro de la acción.
- **Guardar vídeo** graba el último cambio seguido de su acción.
- Correo activa señalar; contraseña activa proteger; mostrar contraseña vuelve a reposo; ocultarla vuelve a proteger. Los campos son una prueba local, sin envío ni persistencia.

## Límites que aún requieren revisión

Los dibujos intermedios no son copias exactas de los originales. La generación conserva el aspecto general, pero varía proporciones, detalles de cara, manos, mochila y emblema. Se puede percibir un ajuste visual al enlazar los cuadros nuevos con el PNG original. Es animación por cuadros, con 12 o 16 posiciones por secuencia: no un rig anatómico continuo ni un modelo 3D. La transición tiene recorrido visible, pero todavía no se considera aprobada visualmente para producción.

La resolución de cada cuadro es menor que la de los originales; al ampliar se aprecia suavidad. El gesto de contraseña conserva la mano protectora y el guiño del boceto 07; no se inventa un gesto de cubrirse ambos ojos. Hablar no tiene voz ni sincronización de labios. La preferencia de movimiento reducido muestra la pose original y la reproducción se suspende al ocultar la pestaña.

No es un paquete final optimizado para el login: el HTML incrusta las siete referencias y los atlas agregan peso. Antes de integrarlo se deben aprobar los cuadros y preparar la carga de assets.

## Uso posterior en React

El controlador ofrece `BaziPlayer.setGesture(nombre)` con `idle`, `welcome`, `thinking`, `worried`, `celebrate`, `email`, `privacy`, `walking`, `speaking`. Para el login, los eventos de foco del correo y contraseña y el estado de mostrar/ocultar contraseña se conectan a esos nombres. El controlador decide la salida y entrada, sin que el formulario cambie directamente de imagen. El visor ya demuestra esa conexión. No está montado aún en los componentes reales.

## Archivos y evidencia

- `transiciones/` contiene copias de los seis atlas generados; `procedencia.json` guarda prompts, referencias y procedencia. No se retocaron ni sobrescribieron los PNG originales.
- `secuencias.json` registra las regiones de cada cuadro; el análisis lee alfa para evitar tomar fragmentos de sprites vecinos. El render encuadra la figura completa dentro del espacio original.
- `verificacion_transiciones.json` verifica rutas entre 72 pares de acciones y 5,184 cambios de destino muestreados. Esto valida el controlador, no la fidelidad de las ilustraciones.
- `verificacion_fuentes.json` comprueba las siete referencias incrustadas y los 16 originales contra su huella anterior.
- `capturas/` y las muestras de vídeo documentan la revisión visual.
- `ensayo_malla/` y `pose-transition.js` son el ensayo descartado de interpolación geométrica; no se cargan en el visor.

Toda la escritura está dentro de assets de Bazi. No se ejecutó Git ni se modificaron componentes React, login, landing o fuentes originales.

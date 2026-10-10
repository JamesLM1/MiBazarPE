# Bazi 2D articulado · v002

Esta versión conserva la ilustración oficial como fuente y permite revisar sus gestos en un visor independiente. Todo está dentro de los assets de Bazi. No está integrada a React, React Three Fiber ni a la landing.

## Abrir y revisar

Abre `revision.html` en un navegador. Mantén `bazi-controller.js` junto al archivo HTML. Las imágenes están incrustadas; no se necesitan servicios externos ni instalación de paquetes.

- **Saludar, Pensar, Preocupación, Celebrar, Señalar, Cubrir ojos, Pasos y Hablar** cambian la pose del personaje articulado.
- **Ver original** muestra el PNG oficial completo e intacto para comparar. La animación vuelve al pulsar el botón otra vez.
- **Pausar** congela la animación. Puedes elegir una pose o ajustar los controles mientras está en pausa para inspeccionar un fotograma.
- **Controles por partes** permite cambiar mirada, párpados, boca, cabeza, brazos, muñecas, piernas, pies, cejas, forma de las manos y flexión del índice.
- **Guardar configuración** descarga los valores actuales; no modifica ningún asset ni los campos de prueba.
- El campo de correo mueve la mirada. Al enfocar el campo de contraseña, Bazi coloca ambas manos sobre los ojos. Mostrar el texto devuelve al reposo. Son campos de demostración local, sin envío ni almacenamiento.

## Qué está implementado

El personaje utiliza grupos SVG con articulaciones independientes. La cabeza, las mangas y las patas proceden del PNG base. La palma abierta procede del boceto de celebración y la mano que señala del boceto de correo. No se sustituyen poses por imágenes completas al pulsar los gestos.

Los ojos tienen mirada y parpadeo; las cejas tienen inclinación y altura; la boca tiene apertura, anchura y trazos de cierre/tristeza. Hay respiración, saludo con la muñeca, celebración y pasos en el sitio. Las transiciones conservan la velocidad al cambiar de gesto. La pausa conserva el tiempo del gesto; la animación se suspende cuando la pestaña queda oculta. La preferencia de movimiento reducido elimina las oscilaciones y muestra directamente las poses.

Se completaron dos capas de apoyo: pelaje bajo los rasgos faciales y torso detrás de los brazos. Se utilizan solamente en las zonas que se descubren al animar. La reconstrucción de brazos generada como ensayo fue descartada por cambiar el encuadre: las mangas y manos cerradas del visor siguen usando el original.

## Límites que requieren revisión visual

- Es un personaje **2D frontal**. No hay volumen para giros de 360 grados ni vistas laterales.
- Los gestos nuevos son composiciones de piezas de la ilustración; no se afirma que cada fotograma sea idéntico a una pose dibujada por un ilustrador.
- El habla utiliza el ritmo del texto. **No hay audio ni sincronización labial con una grabación.**
- La mano tiene tres dibujos (cerrada, abierta y señalando). Solo el índice de la mano señaladora tiene flexión separada; los demás dedos no tienen articulaciones individuales.
- Brazos y piernas giran como piezas. No se ha implementado una flexión independiente de codo/rodilla ni una caminata en perspectiva. Los pasos son una oscilación en el sitio.
- Las capas reconstruidas y los gestos amplios necesitan revisión de James antes de usarse en el producto.
- Las imágenes completas están incrustadas para facilitar esta revisión. Antes de una futura integración conviene recortar/empaquetar las piezas y reducir el peso; el SVG actual ronda 8 MB.

## Archivos

`revision.html`: visor listo para abrir. `Bazi_2D_articulado.svg`: ilustración con grupos y máscaras. `bazi-controller.js`: controlador independiente. `manifest.json`: fuentes, huellas y pivotes. `apoyos/`: dos reconstrucciones auxiliares. `procedencia_apoyos.json`: instrucciones y resultados de generación. `verificacion_controlador.json`: comprobaciones funcionales. `originales_verificados.json`: comparación de los 16 assets originales contra la huella previa.

## Uso futuro del controlador

No se ha conectado a ningún componente existente. En una futura prueba aislada se puede instanciar sobre el SVG incrustado:

```js
const mascota = new BaziPuppet(document.querySelector('#baziSvg'));
mascota.setState('welcome');
mascota.setGaze(4, 2);
mascota.coverEyes(true);
mascota.speak('Hola, James.'); // gesto sin audio
mascota.pause();
mascota.resume();
mascota.dispose(); // al desmontar el visor
```

El SVG exportado contiene las piezas y una pose estática. Para animarlo hace falta cargar el controlador y llamarlo sobre el SVG incrustado en el documento.

# Bazi 2D: recuperar el diseño original

Decisión de James: el prototipo 3D v002 pierde la identidad del original y queda rechazado como base de producción. Se conserva como historial. La prioridad es fidelidad a `02_bazi_pose_base.png` y una futura animación con movimientos y expresiones.

## Qué hay en esta versión

- `revision.html`: revisión local, con original intacto, pequeños movimientos de cabeza y brazos, respiración opcional y seis ilustraciones de expresión existentes.
- `Bazi_2D_capas.svg`: PNG original incrustado sin regenerarlo; grupos independientes con recortes para torso, cabeza y dos brazos. Se abre sin depender de imágenes externas.
- `manifest.json`: fuentes, hashes, pivotes, límites de movimiento y trabajo pendiente.
- `preparar_revision.py` y `revision.template.html`: construcción reproducible de esta revisión, sin reescribir los originales.

El modo Original presenta exactamente el archivo original. El modo Movimiento utiliza sus píxeles con transformaciones y recortes en tiempo de ejecución. La interpolación del navegador y los bordes de recorte pueden cambiar algunos píxeles; no se afirma igualdad píxel a píxel en movimiento. Los rangos son deliberadamente pequeños porque no hay zonas ocultas reconstruidas.

Las poses 04 a 09 son ilustraciones completas existentes, no fotogramas de un rig. Se muestran como tales. La pose de privacidad contiene el símbolo de contraseña original; no representa manos que se mueven hasta tapar los ojos.

## Qué falta para animarlo completamente

1. Separar rostro: ojos, pupilas, párpados, cejas, boca y formas de sonrisa/habla. Dibujar el pelaje que queda debajo de los elementos móviles.
2. Preparar torso y brazos completos con zonas que el PNG oculta; manos y dedos en las poses necesarias. Mantener contorno, tejido, pelaje y sombras de la referencia.
3. Probar deformación y límites de movimiento, evitando huecos y costuras.
4. Construir estados continuos: reposo, parpadeo, mirada, saludo, pensar, preocupación, celebración, señalar correo y cubrirse los ojos.
5. Revisar con James cada expresión a tamaño real antes de optimizar e integrar.

El SVG actual es una base parcial de recorte, no un rig final para Rive/Spine/Live2D ni un PSD con pintura oculta reconstruida. No permite giro de 360 grados, labios sincronizados, seguimiento ocular o articulación de dedos. No se han instalado herramientas adicionales.

## Revisión

1. Abrir `revision.html` y comparar el modo Original con la referencia.
2. Pulsar Probar movimiento o mover los controles. Verificar uniones de hombros y cuello, especialmente en los extremos.
3. Probar las ilustraciones de expresión existentes.
4. Mantener las próximas versiones en carpetas nuevas. No modificar los PNG originales, los modelos anteriores ni la landing.

La ruta es animación 2D sobre arte raster original. El acabado de la referencia puede tener apariencia de render 3D sin que el personaje animado necesite convertirse en un modelo 3D.

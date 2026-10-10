# Bazi · v003 · poses fieles

Corrección de la revisión v002 después de las capturas de James: las manos se separaban de las mangas, faltaban hombros y las expresiones reconstruidas no coincidían con sus bocetos. V003 utiliza cada ilustración original completa como estado final. No reutiliza los recortes ni las capas generadas de v002.

## Uso

Abre `revision.html` y conserva `pose-controller.js` en la misma carpeta. Hay siete poses: reposo, saludo, pensar, preocupación, celebración, señalar correo y proteger contraseña. Cada botón corresponde al PNG original indicado debajo de los botones.

La transición muestra una sola ilustración a la vez: salida por opacidad de 100 ms y entrada de 180 ms. No hay mezcla de dos rostros, espejado de manos, recorte de muñecas, reconstrucción de hombros ni deformación de la silueta. Cada pose termina a opacidad 1 y sin rotación o movimiento. El dibujo completo se escala proporcionalmente para caber en el visor; no se corta ninguna zona del PNG.

**Ver pose final** termina la transición inmediatamente. **Cambiar sin transición** permite inspeccionar cada dibujo sin entradas. **Comparar con el archivo original** muestra la misma imagen como referencia al lado. El fondo claro ayuda a revisar sus bordes transparentes.

El campo de correo activa el boceto 09. El de contraseña activa el boceto 07 del guardián: guiño y mano al frente. Esa ilustración no representa cubrirse los ojos. Mostrar el texto devuelve al reposo. Los campos no transmiten ni guardan datos.

## Correspondencia

| Estado | Archivo original |
| --- | --- |
| Reposo | `01_conceptos/02_bazi_pose_base.png` |
| Saludo | `02_bocetos_funcionales/08_bazi_saludando.png` |
| Pensar | `02_bocetos_funcionales/04_bazi_pensativo.png` |
| Preocupación | `02_bocetos_funcionales/05_bazi_preocupado.png` |
| Celebración | `02_bocetos_funcionales/06_bazi_celebrando.png` |
| Correo | `02_bocetos_funcionales/09_bazi_senalando_email.png` |
| Contraseña | `02_bocetos_funcionales/07_bazi_guardian_de_contrasenas.png` |

## Alcance real

Esta versión corrige la fidelidad de las poses finales y evita las partes defectuosas del montaje anterior. **Es un reproductor de poses completas con entradas por opacidad; no es un rig de animación continua.** No mueve por separado dedos, brazos, ojos o boca, ni genera cuadros intermedios anatómicos. Caminar, hablar con voz o cubrirse los ojos no cuentan con un boceto específico en estas fuentes y no se presentan como movimientos terminados.

Para una animación continua habrá que crear y validar cuadros intermedios o dibujar un rig que incluya codos, hombros, puños y muñecas completos, respetando los PNG actuales como poses objetivo. No debe aprobarse esa fidelidad por pruebas del controlador: requiere revisión visual de las transiciones.

Los bocetos contienen sus propios bordes y pequeños residuos de transparencia. Se mantienen sin retoque para conservar los originales exactamente. Las imágenes completas están incrustadas y el HTML ronda 11 MB; este formato facilita la revisión, pero requiere optimización antes del producto.

No se cambiaron los assets originales, la landing ni los componentes React. V001, v002 y los ensayos 3D se conservan como versiones anteriores. Esta revisión no realiza integración ni operaciones de Git.

`manifest.json` registra las fuentes. `verificacion_fuentes.json` verifica que los bytes de cada PNG incrustado coinciden con su original y que los 16 assets de la línea base se mantienen intactos. `verificacion_controlador.json` comprueba la interrupción, la finalización y el movimiento reducido. Las capturas de las siete poses quedan en `capturas/`.

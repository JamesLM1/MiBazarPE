# Bazi: revisión por iteraciones

Abre `revision.html` para comparar la referencia con las vistas frontal, tres cuartos, lateral y posterior. Funciona localmente, sin instalación ni servicios externos. Las vistas son imágenes renderizadas; para girar el modelo libremente abre `v002/Bazi_v002.blend` en Blender.

La versión actual de revisión es **v002**. Es un prototipo editable de volúmenes, no un personaje terminado ni una exportación optimizada para producción.

## Fuentes y límites

- Principal: `01_conceptos/02_bazi_pose_base.png`.
- Secundarias inspeccionadas: conceptos 01 y 03, poses funcionales 04 a 09.
- Las guías 10 a 14 no se usaron: el historial del usuario las descartó por representar otro personaje.
- El original `04_modelo_3d/Bazi_Master.blend` contiene Cube, Camera y Light; se abrió solo para inspección y no se sobrescribió.
- La profundidad, la espalda y el posterior de la mochila se infirieron. Requieren confirmación visual.
- El pequeño bordado del pecho es una aproximación geométrica a la referencia. No sustituye al logo oficial.
- El blanco utiliza microrelieve provisional, no pelo individual. Ese detalle de material no se conserva igual en GLB.

## Revisión sugerida

1. Revisar primero identidad y proporciones de frente.
2. Revisar volumen de cabeza, ojos, hocico y orejas en tres cuartos y lateral.
3. Confirmar o corregir la mochila posterior.
4. Enviar al chat cambios concretos. Ejemplo: “Conservar los colores; aumentar los ojos; hacer el hocico menos saliente”.
5. Crear v003 con esas correcciones sin modificar v001/v002 entregadas.

## Estado técnico

- Blender local 5.2.2 LTS, render Cycles.
- Modelado procedural con piezas y materiales separados.
- Sin esqueleto, pesos, expresiones ni animaciones todavía.
- Sin retopología para deformación ni presupuesto web final.
- `Bazi_revision.glb` sirve para inspección independiente; no se ha probado en React Three Fiber y no debe asumirse listo para producción.
- No se modificaron la landing, componentes React, dependencias o archivos originales. No se ejecutaron operaciones Git.
- No se usaron generadores 3D externos ni servicios de pago.

## Reproducción

`v001/crear_bazi.py` crea la base desde cero con Blender y admite `--output` apuntando a una carpeta nueva. Se detiene si ya existe el modelo de destino. `v002/refinar_bazi.py` parte de v001 y crea v002; se detiene si v002 ya existe. Mantener el mismo árbol de referencias. Los scripts se ejecutan en una instancia separada de Blender en segundo plano, no sobre la sesión interactiva del usuario.

La siguiente etapa debe centrarse en el parecido y en unir/refinar geometrías antes del rig. Después: esqueleto, pesos, expresiones, animaciones y validación de una exportación optimizada. La integración a la web requiere una instrucción posterior.

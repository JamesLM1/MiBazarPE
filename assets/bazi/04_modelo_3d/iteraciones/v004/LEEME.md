# Bazi v004

Archivo editable: Bazi_v004.blend.

Avance de la base visual tras correcciones de James: mejillas y menton con mayor volumen, patas reconstruidas, pliegues de tela, bolsillo con espesor, sombras de contacto y pelaje peinado.

Frontal.png y tres_cuartos.png son renders de Cycles, no animaciones.

Estado confirmado: cero armatures y cero Actions. La cabeza y la nueva malla de patas no tienen bordes no manifold en sus mallas base; esto no confirma topologia adecuada para animar.

Falta preparar malla para deformacion, rig y pesos, controles de expresion, acciones y transiciones, optimizacion de pelo y materiales, exportacion GLB y prueba web.

Los 80,000 mechones de cabeza son un estudio de Blender; no se deben exportar directamente como solucion web. El modelo tiene mallas remalladas de alta densidad y necesita retopologia y reduccion.

Fuentes originales conservadas. La v003 permanece como version anterior. React, login y landing no se modificaron.

Los scripts ajustar_volumen.py y refinar_acabado.py documentan las operaciones sobre la v003 en una nueva v004. No repetir sobre la v004 terminada: los ajustes se acumularian.


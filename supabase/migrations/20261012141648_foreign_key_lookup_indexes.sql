begin;
-- Cover existing foreign-key lookups; no index or data is removed.
create index idx_fk_cover_1_aplicaciones_pago on public.aplicaciones_pago(id_bazar,id_pago);
create index idx_fk_cover_2_auditoria on public.auditoria(id_usuario);
create index idx_fk_cover_3_bazares on public.bazares(id_lote_demo);
create index idx_fk_cover_4_compras on public.compras(id_usuario_registro);
create index idx_fk_cover_5_creditos on public.creditos(id_bazar,id_venta);
create index idx_fk_cover_6_cuotas on public.cuotas(id_bazar,id_credito);
create index idx_fk_cover_7_detalle_compras on public.detalle_compras(id_bazar,id_compra);
create index idx_fk_cover_8_detalle_liquidaciones on public.detalle_liquidaciones(id_bazar,id_credito);
create index idx_fk_cover_9_detalle_liquidaciones on public.detalle_liquidaciones(id_bazar,id_liquidacion);
create index idx_fk_cover_10_detalle_ventas on public.detalle_ventas(id_bazar,id_venta);
create index idx_fk_cover_11_movimientos_caja on public.movimientos_caja(id_bazar,id_compra);
create index idx_fk_cover_12_movimientos_caja on public.movimientos_caja(id_bazar,id_pago);
create index idx_fk_cover_13_movimientos_caja on public.movimientos_caja(id_bazar,id_venta);
create index idx_fk_cover_14_movimientos_caja on public.movimientos_caja(id_usuario_registro);
create index idx_fk_cover_15_movimientos_inventario on public.movimientos_inventario(id_bazar,id_compra);
create index idx_fk_cover_16_movimientos_inventario on public.movimientos_inventario(id_bazar,id_venta);
create index idx_fk_cover_17_movimientos_inventario on public.movimientos_inventario(id_usuario_registro);
create index idx_fk_cover_18_notificaciones on public.notificaciones(id_bazar,id_cliente);
create index idx_fk_cover_19_pagos on public.pagos(id_bazar,id_cliente);
create index idx_fk_cover_20_pagos on public.pagos(id_usuario_registro);
create index idx_fk_cover_21_ventas on public.ventas(id_bazar,id_cliente);
create index idx_fk_cover_22_ventas on public.ventas(id_usuario_registro);
commit;


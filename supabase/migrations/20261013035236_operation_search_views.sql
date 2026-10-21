begin;
create view public.ventas_busqueda with(security_invoker=true) as select v.*,c.nombre_completo nombre_cliente from public.ventas v left join public.clientes c using(id_cliente,id_bazar);
create view public.creditos_busqueda with(security_invoker=true) as select v.*,c.nombre_completo nombre_cliente from public.creditos v left join public.clientes c using(id_cliente,id_bazar);
create view public.pagos_busqueda with(security_invoker=true) as select v.*,c.nombre_completo nombre_cliente from public.pagos v left join public.clientes c using(id_cliente,id_bazar);
create view public.cobros_busqueda with(security_invoker=true) as select v.*,c.nombre_completo nombre_cliente from public.cuentas_por_cobrar v left join public.clientes c using(id_cliente,id_bazar);
revoke all on public.ventas_busqueda,public.creditos_busqueda,public.pagos_busqueda,public.cobros_busqueda from anon;
grant select on public.ventas_busqueda,public.creditos_busqueda,public.pagos_busqueda,public.cobros_busqueda to authenticated;
commit;

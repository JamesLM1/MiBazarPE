begin;
create function mibazar_privado.detalle_consumo(p_venta uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v public.ventas; resultado jsonb;
begin
 select * into v from public.ventas where id_venta=p_venta;
 if auth.uid() is null or not found or not (mibazar_privado.puede_gestionar(v.id_bazar) or mibazar_privado.es_cliente(v.id_bazar,v.id_cliente)) then raise exception 'ACCESO_DENEGADO'; end if;
 select jsonb_build_object('id',v.id_venta,'fecha',v.fecha,'modalidad',v.modalidad,'moneda',v.moneda,'total',v.total::text,
  'bazar',(select nombre_comercial from public.bazares where id_bazar=v.id_bazar),'demo',(select id_lote_demo is not null from public.bazares where id_bazar=v.id_bazar),
  'productos',(select coalesce(jsonb_agg(jsonb_build_object('nombre',p.nombre,'cantidad',d.cantidad,'precio',d.precio_unitario::text,'subtotal',d.subtotal::text)),'[]') from public.detalle_ventas d join public.productos p using(id_producto) where d.id_venta=v.id_venta and d.id_bazar=v.id_bazar),
  'credito',(select jsonb_build_object('modalidad',c.modalidad,'tasa_diaria',c.tasa_diaria::text,'tasa_mensual',c.tasa_mensual::text,'capital_financiado',c.capital_financiado::text,'regla_fin_mes',coalesce(c.parametros->>'regla_fin_mes','PAGO'),'fecha_corte',c.fecha_corte,'cuotas',(select jsonb_agg(jsonb_build_object('numero',q.numero,'vencimiento',q.vencimiento,'saldo_inicial',q.saldo_inicial::text,'capital',q.capital::text,'interes',q.interes::text,'importe',q.importe::text,'saldo_final',q.saldo_final::text) order by q.numero) from public.cuotas q where q.id_credito=c.id_credito)) from public.creditos c where c.id_venta=v.id_venta)
 ) into resultado;
 return resultado;
end $$;
create function public.detalle_consumo(p_venta uuid) returns jsonb language sql security invoker set search_path='' as $$ select mibazar_privado.detalle_consumo(p_venta) $$;
revoke all on function public.detalle_consumo(uuid),mibazar_privado.detalle_consumo(uuid) from public,anon;
grant execute on function public.detalle_consumo(uuid),mibazar_privado.detalle_consumo(uuid) to authenticated;
commit;

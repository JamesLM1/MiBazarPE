begin;
create or replace function mibazar_privado.detalle_consumo(p_venta uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v public.ventas; resultado jsonb; credito public.creditos; inicio date; fin date; diario jsonb;
begin
 select * into v from public.ventas where id_venta=p_venta;
 if auth.uid() is null or not found or not (mibazar_privado.puede_gestionar(v.id_bazar) or mibazar_privado.es_cliente(v.id_bazar,v.id_cliente)) then raise exception 'ACCESO_DENEGADO'; end if;
 select jsonb_build_object('id',v.id_venta,'fecha',v.fecha,'modalidad',v.modalidad,'moneda',v.moneda,'total',v.total::text,
  'bazar',(select nombre_comercial from public.bazares where id_bazar=v.id_bazar),'demo',(select id_lote_demo is not null from public.bazares where id_bazar=v.id_bazar),
  'productos',(select coalesce(jsonb_agg(jsonb_build_object('nombre',p.nombre,'cantidad',d.cantidad,'precio',d.precio_unitario::text,'subtotal',d.subtotal::text)),'[]') from public.detalle_ventas d join public.productos p using(id_producto) where d.id_venta=v.id_venta and d.id_bazar=v.id_bazar),
  'credito',(select jsonb_build_object('modalidad',c.modalidad,'tasa_diaria',c.tasa_diaria::text,'tasa_mensual',c.tasa_mensual::text,'capital_financiado',c.capital_financiado::text,'regla_fin_mes',coalesce(c.parametros->>'regla_fin_mes','PAGO'),'fecha_corte',c.fecha_corte,'cuotas',(select jsonb_agg(jsonb_build_object('numero',q.numero,'vencimiento',q.vencimiento,'saldo_inicial',q.saldo_inicial::text,'capital',q.capital::text,'interes',q.interes::text,'importe',q.importe::text,'saldo_final',q.saldo_final::text) order by q.numero) from public.cuotas q where q.id_credito=c.id_credito)) from public.creditos c where c.id_venta=v.id_venta)
 ) into resultado;
 -- Read-only contractual explanation: never updates obligations or payment balances.
 select * into credito from public.creditos where id_venta=v.id_venta;
 if found and credito.modalidad='FIN_DE_MES' then
  inicio:=(v.fecha at time zone 'America/Lima')::date;
  fin:=case when coalesce(credito.parametros->>'regla_fin_mes','PAGO')='CORTE'
    then (credito.fecha_corte at time zone 'America/Lima')::date
    else (select min(vencimiento) from public.cuotas where id_credito=credito.id_credito) end;
  select coalesce(jsonb_agg(jsonb_build_object('fecha',inicio+d,'dias',d,
    'interes_dia',(v.total*credito.tasa_diaria)::text,
    'acumulado',(v.total*credito.tasa_diaria*d)::text,
    'proyectado',inicio+d>(now() at time zone 'America/Lima')::date) order by d),'[]') into diario
    from generate_series(1,greatest(0,fin-inicio)) d;
  resultado:=resultado||jsonb_build_object('interes_diario',diario,'inicio_interes',inicio,'fin_interes',fin);
 else
  resultado:=resultado||jsonb_build_object('interes_diario','[]'::jsonb);
 end if;
 return resultado;
end $$;
commit;

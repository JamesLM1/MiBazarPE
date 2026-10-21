
create function public.dashboard_resumen(p_bazar uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare hoy date:=(now() at time zone 'America/Lima')::date; salida jsonb; es_demo boolean;
begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO' using errcode='42501'; end if;
 select id_lote_demo is not null into es_demo from public.bazares where id_bazar=p_bazar;
 with ventas as (
  select v.*, (v.fecha at time zone 'America/Lima')::date dia,extract(hour from v.fecha at time zone 'America/Lima')::int hora
  from public.ventas v where v.id_bazar=p_bazar and v.estado='CONFIRMADA' and v.moneda='PEN'
 ),
 cartera as(select * from public.cuentas_por_cobrar where id_bazar=p_bazar and moneda='PEN'),
 pagar as(select * from public.cuentas_por_pagar where id_bazar=p_bazar and moneda='PEN'),
 dias as(select generate_series(hoy-6,hoy,interval '1 day')::date dia),
 meses as(select generate_series(date_trunc('month',hoy)-interval '11 months',date_trunc('month',hoy),interval '1 month')::date mes),
 categorias as (
  select p.categoria nombre,sum(d.subtotal) importe from public.detalle_ventas d
  join ventas v on v.id_venta=d.id_venta join public.productos p on p.id_producto=d.id_producto
  where v.dia>=date_trunc('month',hoy)::date and v.dia<=hoy group by p.categoria
 ),
 estados as (
  select case when saldo<=0 then 'Pagado' when vencimiento<hoy then 'Vencido' when vencimiento<=hoy+7 then 'Próximo a vencer' else 'Al día' end nombre,
  sum(case when saldo<=0 then 0 else saldo end) importe from cartera group by 1
 ),
 proximos as (
  select x.id_cuota id,x.vencimiento fecha,c.nombre_completo nombre,'Cuota '||x.numero detalle,x.saldo importe,'receivable' tipo
  from cartera x join public.clientes c on c.id_cliente=x.id_cliente where x.saldo>0 and x.vencimiento between hoy and hoy+30
  union all
  select id_compra,vencimiento,proveedor,'Cuenta por pagar',saldo,'payable' from pagar where saldo>0 and vencimiento between hoy and hoy+30
 )
 select jsonb_build_object(
  'source',case when es_demo then 'database-demo' else 'live' end,
  'todaySales',(select coalesce(sum(total),0)::text from ventas where dia=hoy),
  'todayIncome',(select coalesce(sum(monto),0)::text from public.movimientos_caja where id_bazar=p_bazar and fecha=hoy and tipo='INGRESO' and moneda='PEN'),
  'receivables',(select coalesce(sum(saldo),0)::text from cartera),
  'payables',(select coalesce(sum(saldo),0)::text from pagar),
  'creditClients',(select count(distinct id_cliente) from cartera where saldo>0),
  'sales',jsonb_build_object(
   'day',(select jsonb_agg(jsonb_build_object('label',lpad(h::text,2,'0')||':00','amount',(select coalesce(sum(total),0) from ventas where dia=hoy and hora=h)) order by h) from generate_series(0,23)h),
   'week',(select jsonb_agg(jsonb_build_object('label',to_char(d.dia,'DD/MM'),'amount',(select coalesce(sum(total),0) from ventas where dia=d.dia)) order by d.dia) from dias d),
   'month',(select jsonb_agg(jsonb_build_object('label',to_char(d,'DD/MM'),'amount',(select coalesce(sum(total),0) from ventas where dia=d::date)) order by d) from generate_series(date_trunc('month',hoy),hoy,interval '1 day')d),
   'year',(select jsonb_agg(jsonb_build_object('label',to_char(m.mes,'MM/YY'),'amount',(select coalesce(sum(total),0) from ventas where dia>=m.mes and dia<(m.mes+interval '1 month')::date)) order by m.mes) from meses m)
  ),
  'categories',coalesce((select jsonb_agg(jsonb_build_object('name',nombre,'amount',importe,'fill','#006eff') order by importe desc) from categorias),'[]'),
  'accountStates',coalesce((select jsonb_agg(jsonb_build_object('name',nombre,'amount',importe,'fill',case nombre when 'Vencido' then '#aa8b74' when 'Próximo a vencer' then '#70a4ba' else '#006eff' end)) from estados where importe>0),'[]'),
  'due',coalesce((select jsonb_agg(jsonb_build_object('id',id,'date',fecha,'dayLabel',case when fecha=hoy then 'Hoy' when fecha=hoy+1 then 'Mañana' else to_char(fecha,'DD/MM') end,'name',nombre,'detail',detalle,'amount',importe::text,'status',case when fecha=hoy then 'Pendiente' else 'Próximo a vencer' end,'kind',tipo) order by fecha,id) from (select * from proximos order by fecha,id limit 8)x),'[]'),
  'generatedAt',now(),
  'otherCurrencies',(select exists(select 1 from public.ventas where id_bazar=p_bazar and moneda<>'PEN'))
 ) into salida;
 return salida;
end $$;
revoke all on function public.dashboard_resumen(uuid) from public,anon;
grant execute on function public.dashboard_resumen(uuid) to authenticated;

-- Audit changes in master data without exposing personal payloads.
create function mibazar_privado.auditar_maestro() returns trigger language plpgsql security definer set search_path='' as $$
declare b uuid; r uuid;
begin
 if auth.uid() is null then return new; end if;
 if tg_table_name='productos' then b:=new.id_bazar; r:=new.id_producto;
 elsif tg_table_name='clientes' then b:=new.id_bazar; r:=new.id_cliente;
 else select id_bazar into b from public.clientes where id_cliente=new.id_cliente; r:=new.id_configuracion;
 end if;
 if not mibazar_privado.puede_gestionar(b) then raise exception 'ACCESO_DENEGADO' using errcode='42501'; end if;
 perform mibazar_privado.registrar_evento(b,tg_op,tg_table_name,r);
 return new;
end $$;
revoke all on function mibazar_privado.auditar_maestro() from public,anon,authenticated;
create trigger auditar_productos after insert or update on public.productos for each row execute function mibazar_privado.auditar_maestro();
create trigger auditar_clientes after insert or update on public.clientes for each row execute function mibazar_privado.auditar_maestro();
create trigger auditar_configuracion after insert or update on public.configuraciones_credito for each row execute function mibazar_privado.auditar_maestro();


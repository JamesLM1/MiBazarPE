begin;
-- Preserve existing contractual settings; new accounts follow US13's cutoff rule.
alter table public.configuraciones_credito add column regla_fin_mes text not null default 'PAGO' check(regla_fin_mes in ('CORTE','PAGO'));
alter table public.configuraciones_credito alter column regla_fin_mes set default 'CORTE';
grant insert(regla_fin_mes),update(regla_fin_mes) on public.configuraciones_credito to authenticated;
create view public.reportes_ventas_mensuales with(security_invoker=true) as
select id_bazar,to_char(fecha at time zone 'America/Lima','YYYY-MM') mes,moneda,count(*) operaciones,sum(total) total,
 coalesce(sum(total) filter(where modalidad='CONTADO'),0) contado,coalesce(sum(total) filter(where modalidad<>'CONTADO'),0) credito
from public.ventas where estado='CONFIRMADA' group by 1,2,3;
grant select on public.reportes_ventas_mensuales to authenticated;
revoke all on public.reportes_ventas_mensuales from anon;

create function public.resumen_modulo(p_bazar uuid,p_modulo text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare resultado jsonb; montos jsonb;
begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO'; end if;
 case p_modulo
 when 'ventas','reportes' then
  select jsonb_build_object('Registros',count(*),'Contado',count(*) filter(where modalidad='CONTADO'),'Crédito',count(*) filter(where modalidad<>'CONTADO')) into resultado from public.ventas where id_bazar=p_bazar;
  select jsonb_agg(jsonb_build_object('label','Total','currency',moneda,'amount',importe::text)) into montos from(select moneda,sum(total) importe from public.ventas where id_bazar=p_bazar group by moneda)s;
 when 'clientes' then
  select jsonb_build_object('Registros',count(*),'Activos',count(*) filter(where estado_registro='ACTIVO'),'Con línea',count(a.id_cliente)) into resultado from public.clientes c left join public.cuentas_corrientes a using(id_cliente,id_bazar) where c.id_bazar=p_bazar;
  select jsonb_agg(jsonb_build_object('label','Deuda','currency',moneda,'amount',importe::text)) into montos from(select moneda,sum(deuda_total) importe from public.cuentas_corrientes where id_bazar=p_bazar group by moneda)s;
 when 'inventario' then
  select jsonb_build_object('Registros',count(*),'Agotados',count(*) filter(where stock_actual=0),'Bajo mínimo',count(*) filter(where stock_actual>0 and stock_actual<=stock_minimo),'Unidades',coalesce(sum(stock_actual),0)) into resultado from public.productos where id_bazar=p_bazar;
 when 'creditos' then
  select jsonb_build_object('Registros',count(*),'Fin de mes',count(*) filter(where modalidad='FIN_DE_MES'),'En cuotas',count(*) filter(where modalidad='EN_CUOTAS')) into resultado from public.creditos where id_bazar=p_bazar;
  select jsonb_agg(jsonb_build_object('label','Saldo','currency',moneda,'amount',importe::text)) into montos from(select moneda,sum(saldo) importe from public.cuentas_por_cobrar where id_bazar=p_bazar group by moneda)s;
 when 'pagos' then
  select jsonb_build_object('Registros',count(*)) into resultado from public.pagos where id_bazar=p_bazar;
  select jsonb_agg(jsonb_build_object('label','Cobrado','currency',moneda,'amount',importe::text)) into montos from(select moneda,sum(monto) importe from public.pagos where id_bazar=p_bazar group by moneda)s;
 when 'compras' then
  select jsonb_build_object('Registros',count(*)) into resultado from public.compras where id_bazar=p_bazar;
  select jsonb_agg(jsonb_build_object('label','Total','currency',moneda,'amount',importe::text)) into montos from(select moneda,sum(total) importe from public.compras where id_bazar=p_bazar group by moneda)s;
 when 'caja' then
  select jsonb_build_object('Registros',count(*)) into resultado from public.movimientos_caja where id_bazar=p_bazar;
  select jsonb_agg(jsonb_build_object('label',concepto,'currency',moneda,'amount',importe::text)) into montos from (
   select moneda,'Ingresos' concepto,sum(monto) importe from public.movimientos_caja where id_bazar=p_bazar and tipo='INGRESO' group by moneda
   union all select moneda,'Egresos',sum(monto) from public.movimientos_caja where id_bazar=p_bazar and tipo='EGRESO' group by moneda
   union all select moneda,'Neto',sum(case when tipo='INGRESO' then monto else -monto end) from public.movimientos_caja where id_bazar=p_bazar group by moneda)s;
 when 'cuentas-por-cobrar','cuentas-por-pagar' then
  if p_modulo='cuentas-por-cobrar' then
   select jsonb_build_object('Registros',count(*),'Vencidas',count(*) filter(where vencimiento<(now() at time zone 'America/Lima')::date),'Por vencer',count(*) filter(where vencimiento>=(now() at time zone 'America/Lima')::date)) into resultado from public.cuentas_por_cobrar where id_bazar=p_bazar and saldo>0;
   select jsonb_agg(jsonb_build_object('label','Saldo','currency',moneda,'amount',importe::text)) into montos from(select moneda,sum(saldo) importe from public.cuentas_por_cobrar where id_bazar=p_bazar and saldo>0 group by moneda)s;
  else
   select jsonb_build_object('Registros',count(*),'Vencidas',count(*) filter(where vencimiento<(now() at time zone 'America/Lima')::date),'Por vencer',count(*) filter(where vencimiento>=(now() at time zone 'America/Lima')::date)) into resultado from public.cuentas_por_pagar where id_bazar=p_bazar and saldo>0;
   select jsonb_agg(jsonb_build_object('label','Saldo','currency',moneda,'amount',importe::text)) into montos from(select moneda,sum(saldo) importe from public.cuentas_por_pagar where id_bazar=p_bazar and saldo>0 group by moneda)s;
  end if;
 else raise exception 'MODULO_INVALIDO';
 end case;
 return jsonb_build_object('counts',resultado,'amounts',coalesce(montos,'[]'));
end $$;
revoke all on function public.resumen_modulo(uuid,text) from public,anon;
grant execute on function public.resumen_modulo(uuid,text) to authenticated;
create or replace function mibazar_privado.plan_credito(cfg public.configuraciones_credito,total numeric,modalidad text,n integer,gracia integer,instante timestamptz) returns jsonb
language plpgsql stable set search_path='' as $$
declare mensual numeric; diaria numeric; moratoria numeric; principal numeric; saldo numeric; cuota numeric; interes numeric; amort numeric;
 fecha date; mes date; corte timestamptz; vence date; k integer; filas jsonb:='[]';
begin
 if total is null or total<=0 or instante is null or modalidad is null or modalidad not in ('FIN_DE_MES','EN_CUOTAS') then raise exception 'VENTA_INVALIDA'; end if;
 if n is null or (modalidad='EN_CUOTAS' and (n<2 or n>cfg.plazo_maximo_meses)) or (modalidad='FIN_DE_MES' and n<>1) or gracia is null or gracia not between 0 and 30 then raise exception 'PLAZO_INVALIDO'; end if;
 mensual:=mibazar_privado.tasa_periodica(cfg.tasa_compensatoria,cfg.tipo_tasa_compensatoria,cfg.capitalizacion_compensatoria,30);
 diaria:=mibazar_privado.tasa_periodica(cfg.tasa_compensatoria,cfg.tipo_tasa_compensatoria,cfg.capitalizacion_compensatoria,1);
 moratoria:=mibazar_privado.tasa_periodica(cfg.tasa_moratoria,cfg.tipo_tasa_moratoria,cfg.capitalizacion_moratoria,1);
 principal:=case when modalidad='EN_CUOTAS' then total*power(1+diaria,gracia) else total end;
 fecha:=(instante at time zone 'America/Lima')::date; mes:=date_trunc('month',fecha)::date;
 corte:=(mibazar_privado.fecha_mensual(mes,cfg.dia_corte)+cfg.hora_corte) at time zone 'America/Lima';
 if instante>corte then mes:=(mes+interval '1 month')::date; corte:=(mibazar_privado.fecha_mensual(mes,cfg.dia_corte)+cfg.hora_corte) at time zone 'America/Lima'; end if;
 saldo:=principal;
 cuota:=case when mensual=0 then principal/n else principal*mensual*power(1+mensual,n)/(power(1+mensual,n)-1) end;
 for k in 1..n loop
  if modalidad='FIN_DE_MES' then
   vence:=mibazar_privado.fecha_mensual(mes,cfg.dia_pago);
   -- The contract snapshot selects cutoff or payment date for future loans.
   interes:=total*diaria*((case when cfg.regla_fin_mes='CORTE' then (corte at time zone 'America/Lima')::date else vence end)-fecha); amort:=total;
  else
   vence:=mibazar_privado.fecha_mensual((fecha+gracia+(k||' month')::interval)::date,extract(day from fecha+gracia)::integer);
   interes:=saldo*mensual; amort:=case when k=n then saldo else cuota-interes end;
  end if;
  filas:=filas||jsonb_build_array(jsonb_build_object('numero',k,'vencimiento',vence,'saldo_inicial',saldo::text,'interes',interes::text,'capital',amort::text,'importe',(amort+interes)::text,'saldo_final',(case when k=n then 0 else saldo-amort end)::text));
  saldo:=saldo-amort;
 end loop;
 return jsonb_build_object('regla_fin_mes',cfg.regla_fin_mes,'total',total::text,'capital_financiado',principal::text,'moneda',cfg.moneda,'modalidad',modalidad,'tasa_mensual',mensual::text,'tasa_diaria',diaria::text,'tasa_mora_diaria',moratoria::text,'fecha_corte',corte,'cuotas',filas);
end $$;


commit;

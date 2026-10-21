begin;
-- One numeric calculation shared by preview, customer simulation and persistence.
-- Historical loans are never recalculated by this migration.
create function mibazar_privado.plan_credito(cfg public.configuraciones_credito,total numeric,modalidad text,n integer,gracia integer,instante timestamptz) returns jsonb
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
   -- Preserve the existing contracted rule: simple interest until scheduled payment.
   interes:=total*diaria*(vence-fecha); amort:=total;
  else
   vence:=mibazar_privado.fecha_mensual((fecha+gracia+(k||' month')::interval)::date,extract(day from fecha+gracia)::integer);
   interes:=saldo*mensual; amort:=case when k=n then saldo else cuota-interes end;
  end if;
  filas:=filas||jsonb_build_array(jsonb_build_object('numero',k,'vencimiento',vence,'saldo_inicial',saldo::text,'interes',interes::text,'capital',amort::text,'importe',(amort+interes)::text,'saldo_final',(case when k=n then 0 else saldo-amort end)::text));
  saldo:=saldo-amort;
 end loop;
 return jsonb_build_object('total',total::text,'capital_financiado',principal::text,'moneda',cfg.moneda,'modalidad',modalidad,'tasa_mensual',mensual::text,'tasa_diaria',diaria::text,'tasa_mora_diaria',moratoria::text,'fecha_corte',corte,'cuotas',filas);
end $$;

create function mibazar_privado.simular_credito(p_cliente uuid,p_monto numeric,p_modalidad text,p_cuotas integer,p_gracia integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cli public.clientes; cfg public.configuraciones_credito; plan jsonb; ocupado numeric;
begin
 select * into cli from public.clientes where id_cliente=p_cliente;
 if auth.uid() is null or not found or not (mibazar_privado.puede_gestionar(cli.id_bazar) or mibazar_privado.es_cliente(cli.id_bazar,p_cliente)) then raise exception 'ACCESO_DENEGADO'; end if;
 if cli.estado_registro<>'ACTIVO' or cli.estado_crediticio<>'AL_DIA' then raise exception 'CLIENTE_NO_HABILITADO'; end if;
 select * into cfg from public.configuraciones_credito where id_cliente=p_cliente and activo;
 if not found then raise exception 'CONFIGURACION_REQUERIDA'; end if;
 if exists(select 1 from public.cuotas q join public.creditos c using(id_credito) where c.id_cliente=p_cliente and q.vencimiento<(now() at time zone 'America/Lima')::date and (q.capital>q.capital_pagado or q.interes>q.interes_pagado or q.mora_devengada>q.mora_pagada)) then raise exception 'CLIENTE_EN_MORA'; end if;
 if p_monto is null or p_monto<=0 or p_monto>10000 then raise exception 'MONTO_INVALIDO'; end if;
 plan:=mibazar_privado.plan_credito(cfg,p_monto,p_modalidad,p_cuotas,p_gracia,now());
 select coalesce(sum(q.capital-q.capital_pagado),0) into ocupado from public.cuotas q join public.creditos c using(id_credito) where c.id_cliente=p_cliente;
 if ocupado+(plan->>'capital_financiado')::numeric>cfg.linea_credito_max then raise exception 'LINEA_EXCEDIDA'; end if;
 return plan||jsonb_build_object('disponible',(cfg.linea_credito_max-ocupado)::text);
end $$;

create function mibazar_privado.previsualizar_venta(p_bazar uuid,p_cliente uuid,p_items jsonb,p_modalidad text,p_cuotas integer,p_gracia integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item record; prod public.productos; total numeric:=0; detalle jsonb:='[]'; plan jsonb;
begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO'; end if;
 if p_modalidad is null or p_modalidad not in ('CONTADO','FIN_DE_MES','EN_CUOTAS') or p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'VENTA_INVALIDA'; end if;
 if p_cliente is not null and not exists(select 1 from public.clientes where id_cliente=p_cliente and id_bazar=p_bazar and estado_registro='ACTIVO') then raise exception 'CLIENTE_INVALIDO'; end if;
 for item in select (x->>'id_producto')::uuid id,sum((x->>'cantidad')::integer)::integer cantidad from jsonb_array_elements(p_items) x group by 1 order by 1 loop
  if item.id is null or item.cantidad is null or item.cantidad not between 1 and 500 then raise exception 'CANTIDAD_INVALIDA'; end if;
  select * into prod from public.productos where id_producto=item.id and id_bazar=p_bazar and estado='ACTIVO';
  if not found or prod.stock_actual<item.cantidad then raise exception 'STOCK_INSUFICIENTE'; end if;
  if (p_modalidad='FIN_DE_MES' and not prod.permite_fin_mes) or (p_modalidad='EN_CUOTAS' and not prod.permite_cuotas) then raise exception 'MODALIDAD_NO_HABILITADA'; end if;
  total:=total+item.cantidad*case when p_modalidad='CONTADO' then prod.precio_contado else prod.precio_credito end;
  detalle:=detalle||jsonb_build_array(jsonb_build_object('producto',prod.nombre,'cantidad',item.cantidad,'precio',(case when p_modalidad='CONTADO' then prod.precio_contado else prod.precio_credito end)::text));
 end loop;
 if p_modalidad='CONTADO' then plan:=jsonb_build_object('total',total::text,'moneda','PEN','modalidad',p_modalidad,'cuotas','[]'::jsonb);
 else
  if p_cliente is null then raise exception 'CLIENTE_NO_HABILITADO'; end if;
  plan:=mibazar_privado.simular_credito(p_cliente,total,p_modalidad,p_cuotas,p_gracia);
  if plan->>'moneda'<>'PEN' then raise exception 'MONEDA_NO_COMPATIBLE'; end if;
 end if;
 return plan||jsonb_build_object('detalle',detalle);
end $$;

create function mibazar_privado.cambiar_estado_bazar(p_bazar uuid,p_estado text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not mibazar_privado.es_superadmin() then raise exception 'ACCESO_DENEGADO'; end if;
 if p_estado is null or p_estado not in ('ACTIVO','BAJA','SUSPENDIDO') then raise exception 'ESTADO_INVALIDO'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_bazar::text,0));
 perform 1 from public.bazares where id_bazar=p_bazar for update;
 if not found then raise exception 'BAZAR_INEXISTENTE'; end if;
 if p_estado='BAJA' and (exists(select 1 from public.cuotas where id_bazar=p_bazar and (capital>capital_pagado or interes>interes_pagado or mora_devengada>mora_pagada)) or exists(select 1 from public.cuentas_por_pagar where id_bazar=p_bazar and saldo>0)) then raise exception 'OBLIGACIONES_PENDIENTES'; end if;
 update public.bazares set estado=p_estado where id_bazar=p_bazar;
 perform mibazar_privado.registrar_evento(p_bazar,'CAMBIAR_ESTADO','bazares',p_bazar,jsonb_build_object('estado',p_estado));
end $$;

create function public.previsualizar_venta(p_bazar uuid,p_cliente uuid,p_items jsonb,p_modalidad text,p_cuotas integer,p_gracia integer) returns jsonb language sql security invoker set search_path='' as $$ select mibazar_privado.previsualizar_venta(p_bazar,p_cliente,p_items,p_modalidad,p_cuotas,p_gracia) $$;
create function public.simular_credito(p_cliente uuid,p_monto numeric,p_modalidad text,p_cuotas integer,p_gracia integer) returns jsonb language sql security invoker set search_path='' as $$ select mibazar_privado.simular_credito(p_cliente,p_monto,p_modalidad,p_cuotas,p_gracia) $$;
create function public.cambiar_estado_bazar(p_bazar uuid,p_estado text) returns void language sql security invoker set search_path='' as $$ select mibazar_privado.cambiar_estado_bazar(p_bazar,p_estado) $$;
revoke all on function mibazar_privado.plan_credito(public.configuraciones_credito,numeric,text,integer,integer,timestamptz) from public,anon,authenticated;
do $$ declare s text; sig text; begin
 foreach s in array array['public','mibazar_privado'] loop
  foreach sig in array array['previsualizar_venta(uuid,uuid,jsonb,text,integer,integer)','simular_credito(uuid,numeric,text,integer,integer)','cambiar_estado_bazar(uuid,text)'] loop
   execute format('revoke all on function %I.%s from public,anon',s,sig);
   execute format('grant execute on function %I.%s to authenticated',s,sig);
  end loop;
 end loop;
end $$;
create or replace function mibazar_privado.motor_venta(b uuid,cliente uuid,items jsonb,modalidad text,n integer,gracia integer,clave uuid,instante timestamptz) returns uuid
language plpgsql set search_path='' as $$
declare plan jsonb; fila jsonb; v uuid; cr uuid; item record; prod public.productos; cfg public.configuraciones_credito; cli public.clientes;
 total numeric:=0; ocupado numeric; principal numeric; mensual numeric; diaria numeric; moratoria numeric;
 corte timestamptz; mes date; fecha date; vence date; saldo numeric; cuota numeric; interes numeric; amort numeric; k integer;
begin
 if clave is null or instante is null or instante>now() then raise exception 'FECHA_O_CLAVE_INVALIDA'; end if;
 if modalidad is null or modalidad not in ('CONTADO','FIN_DE_MES','EN_CUOTAS') or items is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 100 then raise exception 'VENTA_INVALIDA'; end if;
 -- Serializes retry keys and concurrent sales per tenant; product rows are also locked.
 perform pg_advisory_xact_lock(hashtextextended(b::text,0));
 select id_venta into v from public.ventas where id_bazar=b and idempotencia=clave;
 if v is not null then return v; end if;
 if not exists(select 1 from public.bazares where id_bazar=b and estado='ACTIVO') then raise exception 'BAZAR_INACTIVO'; end if;
 fecha:=(instante at time zone 'America/Lima')::date;
 if cliente is not null then
  select * into cli from public.clientes where id_cliente=cliente and id_bazar=b for update;
  if not found or cli.estado_registro<>'ACTIVO' then raise exception 'CLIENTE_INVALIDO'; end if;
 end if;
 for item in select (x->>'id_producto')::uuid id,sum((x->>'cantidad')::integer)::integer cantidad from jsonb_array_elements(items) x group by 1 order by 1 loop
  if item.id is null or item.cantidad is null or item.cantidad not between 1 and 500 then raise exception 'CANTIDAD_INVALIDA'; end if;
  select * into prod from public.productos where id_producto=item.id and id_bazar=b for update;
  if not found or prod.estado<>'ACTIVO' or prod.stock_actual<item.cantidad then raise exception 'STOCK_INSUFICIENTE'; end if;
  if (modalidad='FIN_DE_MES' and not prod.permite_fin_mes) or (modalidad='EN_CUOTAS' and not prod.permite_cuotas) then raise exception 'MODALIDAD_NO_HABILITADA'; end if;
  total:=total+item.cantidad*case when modalidad='CONTADO' then prod.precio_contado else prod.precio_credito end;
 end loop;
 if modalidad<>'CONTADO' then
  if cliente is null or cli.estado_crediticio<>'AL_DIA' then raise exception 'CLIENTE_NO_HABILITADO'; end if;
  select * into cfg from public.configuraciones_credito where id_cliente=cliente and activo for update;
  if not found then raise exception 'CONFIGURACION_REQUERIDA'; end if;
  if n is null or (modalidad='EN_CUOTAS' and (n<2 or n>cfg.plazo_maximo_meses)) or (modalidad='FIN_DE_MES' and n<>1) or gracia is null or gracia not between 0 and 30 then raise exception 'PLAZO_INVALIDO'; end if;
  if exists(select 1 from public.cuotas q join public.creditos c using(id_credito) where c.id_cliente=cliente and q.vencimiento<fecha and (q.capital>q.capital_pagado or q.interes>q.interes_pagado or q.mora_devengada>q.mora_pagada)) then raise exception 'CLIENTE_EN_MORA'; end if;
  if cfg.moneda<>'PEN' then raise exception 'MONEDA_NO_COMPATIBLE'; end if;
  plan:=mibazar_privado.plan_credito(cfg,total,modalidad,n,gracia,instante);
  mensual:=(plan->>'tasa_mensual')::numeric; diaria:=(plan->>'tasa_diaria')::numeric;
  moratoria:=(plan->>'tasa_mora_diaria')::numeric; principal:=(plan->>'capital_financiado')::numeric;
  select coalesce(sum(q.capital-q.capital_pagado),0) into ocupado from public.cuotas q join public.creditos c using(id_credito) where c.id_cliente=cliente;
  if ocupado+principal>cfg.linea_credito_max then raise exception 'LINEA_EXCEDIDA'; end if;
  mes:=date_trunc('month',fecha)::date;
  corte:=(mibazar_privado.fecha_mensual(mes,cfg.dia_corte)+cfg.hora_corte) at time zone 'America/Lima';
  if instante>corte then mes:=(mes+interval '1 month')::date; corte:=(mibazar_privado.fecha_mensual(mes,cfg.dia_corte)+cfg.hora_corte) at time zone 'America/Lima'; end if;
 end if;
 insert into public.ventas(id_bazar,id_cliente,fecha,modalidad,moneda,total,idempotencia,id_usuario_registro)
 values(b,cliente,instante,modalidad,coalesce(cfg.moneda,'PEN'),total,clave,auth.uid()) returning id_venta into v;
 for item in select (x->>'id_producto')::uuid id,sum((x->>'cantidad')::integer)::integer cantidad from jsonb_array_elements(items)x group by 1 order by 1 loop
  select * into prod from public.productos where id_producto=item.id;
  insert into public.detalle_ventas(id_bazar,id_venta,id_producto,cantidad,precio_unitario) values(b,v,prod.id_producto,item.cantidad,case when modalidad='CONTADO' then prod.precio_contado else prod.precio_credito end);
  insert into public.movimientos_inventario(id_bazar,id_producto,fecha,tipo,cantidad,stock_anterior,stock_resultante,id_venta,motivo,id_usuario_registro)
  values(b,prod.id_producto,instante,'VENTA',item.cantidad,prod.stock_actual,prod.stock_actual-item.cantidad,v,'Venta confirmada',auth.uid());
  update public.productos set stock_actual=stock_actual-item.cantidad where id_producto=prod.id_producto;
  if prod.stock_actual-item.cantidad<=prod.stock_minimo then
   insert into public.notificaciones(id_bazar,tipo,mensaje,clave) values(b,'STOCK_BAJO','Reponer '||prod.nombre,'stock:'||prod.id_producto) on conflict do nothing;
  end if;
 end loop;
 if modalidad='CONTADO' then
  insert into public.movimientos_caja(id_bazar,fecha,tipo,concepto,monto,moneda,id_venta,idempotencia,id_usuario_registro) values(b,fecha,'INGRESO','Venta al contado',total,'PEN',v,clave,auth.uid());
 else
  insert into public.creditos(id_bazar,id_cliente,id_venta,modalidad,capital_original,capital_financiado,moneda,numero_cuotas,dias_gracia,tasa_mensual,tasa_diaria,tasa_mora_diaria,parametros,fecha_corte)
  values(b,cliente,v,modalidad,total,principal,cfg.moneda,n,gracia,mensual,diaria,moratoria,to_jsonb(cfg),corte) returning id_credito into cr;
  for fila in select value from jsonb_array_elements(plan->'cuotas') loop
   insert into public.cuotas(id_bazar,id_credito,numero,vencimiento,saldo_inicial,interes,capital,importe,saldo_final,mora_hasta)
   values(b,cr,(fila->>'numero')::integer,(fila->>'vencimiento')::date,(fila->>'saldo_inicial')::numeric,(fila->>'interes')::numeric,(fila->>'capital')::numeric,(fila->>'importe')::numeric,(fila->>'saldo_final')::numeric,(fila->>'vencimiento')::date);
  end loop;
 end if;
 perform mibazar_privado.registrar_evento(b,'CREAR','ventas',v,jsonb_build_object('total',total,'modalidad',modalidad));
 return v;
end $$;


create function mibazar_privado.confirmar_venta(p_bazar uuid,p_cliente uuid,p_items jsonb,p_modalidad text,p_cuotas integer,p_gracia integer,p_clave uuid,p_revision jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare previa uuid; actual jsonb;
begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_bazar::text,0));
 select id_venta into previa from public.ventas where id_bazar=p_bazar and idempotencia=p_clave;
 if previa is not null then return previa; end if;
 perform 1 from public.clientes where id_cliente=p_cliente and id_bazar=p_bazar for update;
 perform 1 from public.configuraciones_credito where id_cliente=p_cliente for update;
 perform 1 from public.productos where id_bazar=p_bazar and id_producto in(select (x->>'id_producto')::uuid from jsonb_array_elements(p_items)x) order by id_producto for update;
 actual:=mibazar_privado.previsualizar_venta(p_bazar,p_cliente,p_items,p_modalidad,p_cuotas,p_gracia);
 if p_revision is distinct from actual then raise exception 'REVISION_CAMBIO'; end if;
 return mibazar_privado.motor_venta(p_bazar,p_cliente,p_items,p_modalidad,p_cuotas,p_gracia,p_clave,now());
end $$;
create function public.confirmar_venta(p_bazar uuid,p_cliente uuid,p_items jsonb,p_modalidad text,p_cuotas integer,p_gracia integer,p_clave uuid,p_revision jsonb) returns uuid language sql security invoker set search_path='' as $$ select mibazar_privado.confirmar_venta(p_bazar,p_cliente,p_items,p_modalidad,p_cuotas,p_gracia,p_clave,p_revision) $$;
revoke all on function mibazar_privado.confirmar_venta(uuid,uuid,jsonb,text,integer,integer,uuid,jsonb),public.confirmar_venta(uuid,uuid,jsonb,text,integer,integer,uuid,jsonb) from public,anon;
grant execute on function mibazar_privado.confirmar_venta(uuid,uuid,jsonb,text,integer,integer,uuid,jsonb),public.confirmar_venta(uuid,uuid,jsonb,text,integer,integer,uuid,jsonb) to authenticated;
commit;

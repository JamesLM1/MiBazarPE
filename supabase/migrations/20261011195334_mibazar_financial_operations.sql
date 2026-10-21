
-- Financial engine uses NUMERIC with no declared scale and no intermediate rounding.
alter table public.pagos add column ajuste_redondeo numeric not null default 0 check(abs(ajuste_redondeo)<=0.005);
create function mibazar_privado.tasa_periodica(tasa numeric,tipo text,capitalizacion text,dias integer) returns numeric
language plpgsql immutable set search_path='' as $$
declare m numeric;
begin
 if tasa is null or tasa<0 or dias<0 then raise exception 'TASA_INVALIDA'; end if;
 if tipo='TEA' then return power(1+tasa,dias::numeric/360)-1; end if;
 m:=case capitalizacion when 'DIARIA' then 360 when 'MENSUAL' then 12 when 'BIMESTRAL' then 6 when 'TRIMESTRAL' then 4 when 'CUATRIMESTRAL' then 3 when 'SEMESTRAL' then 2 when 'ANUAL' then 1 end;
 if tipo<>'TNA' or m is null then raise exception 'CAPITALIZACION_INVALIDA'; end if;
 return power(1+tasa/m,m*dias/360)-1;
end $$;
create function mibazar_privado.fecha_mensual(mes date,dia integer) returns date language sql immutable set search_path='' as $$
 select (date_trunc('month',mes)::date + (least(dia,extract(day from date_trunc('month',mes)+interval '1 month -1 day')::int)-1))::date
$$;
create function mibazar_privado.registrar_evento(b uuid,accion text,entidad text,registro uuid,datos jsonb default '{}') returns void
language sql set search_path='' as $$
 insert into public.auditoria(id_bazar,id_usuario,accion,entidad,id_registro,datos) values(b,auth.uid(),accion,entidad,registro,datos)
$$;

create function mibazar_privado.motor_venta(b uuid,cliente uuid,items jsonb,modalidad text,n integer,gracia integer,clave uuid,instante timestamptz) returns uuid
language plpgsql set search_path='' as $$
declare v uuid; cr uuid; item record; prod public.productos; cfg public.configuraciones_credito; cli public.clientes;
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
  mensual:=mibazar_privado.tasa_periodica(cfg.tasa_compensatoria,cfg.tipo_tasa_compensatoria,cfg.capitalizacion_compensatoria,30);
  diaria:=mibazar_privado.tasa_periodica(cfg.tasa_compensatoria,cfg.tipo_tasa_compensatoria,cfg.capitalizacion_compensatoria,1);
  moratoria:=mibazar_privado.tasa_periodica(cfg.tasa_moratoria,cfg.tipo_tasa_moratoria,cfg.capitalizacion_moratoria,1);
  principal:=case when modalidad='EN_CUOTAS' then total*power(1+diaria,gracia) else total end;
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
  saldo:=principal;
  cuota:=case when mensual=0 then principal/n else principal*mensual*power(1+mensual,n)/(power(1+mensual,n)-1) end;
  for k in 1..n loop
   if modalidad='FIN_DE_MES' then
    vence:=mibazar_privado.fecha_mensual(mes,cfg.dia_pago);
    -- Explicitly use scheduled payment date, per PDF data dictionary pp.32/34.
    interes:=total*diaria*(vence-fecha); amort:=total;
   else
    -- The first regular 30-day period starts after the specified grace days.
    vence:=mibazar_privado.fecha_mensual((fecha+gracia+(k||' month')::interval)::date,extract(day from fecha+gracia)::integer);
    interes:=saldo*mensual; amort:=case when k=n then saldo else cuota-interes end;
   end if;
   insert into public.cuotas(id_bazar,id_credito,numero,vencimiento,saldo_inicial,interes,capital,importe,saldo_final,mora_hasta)
   values(b,cr,k,vence,saldo,interes,amort,amort+interes,case when k=n then 0 else saldo-amort end,vence);
   saldo:=saldo-amort;
  end loop;
 end if;
 perform mibazar_privado.registrar_evento(b,'CREAR','ventas',v,jsonb_build_object('total',total,'modalidad',modalidad));
 return v;
end $$;

create function mibazar_privado.motor_pago(b uuid,cuota_id uuid,monto numeric,clave uuid,p_fecha date,medio text default 'EFECTIVO') returns uuid
language plpgsql set search_path='' as $$
declare q public.cuotas; c public.creditos; pago uuid; mora numeric; exigible numeric; disponible numeric; am numeric; ai numeric; ac numeric; ajuste numeric:=0;
begin
 if monto is null or monto<=0 or monto>15000 or p_fecha is null or p_fecha>(now() at time zone 'America/Lima')::date or clave is null then raise exception 'PAGO_INVALIDO'; end if;
 perform pg_advisory_xact_lock(hashtextextended(b::text,0));
 select id_pago into pago from public.pagos where id_bazar=b and idempotencia=clave;
 if pago is not null then return pago; end if;
 select * into q from public.cuotas where id_cuota=cuota_id and id_bazar=b for update;
 if not found then raise exception 'CUOTA_INACCESIBLE'; end if;
 select * into c from public.creditos where id_credito=q.id_credito;
 perform 1 from public.clientes where id_cliente=c.id_cliente for update;
 if p_fecha<(select (v.fecha at time zone 'America/Lima')::date from public.ventas v where v.id_venta=c.id_venta)
 or exists(select 1 from public.aplicaciones_pago a join public.pagos p using(id_pago) where a.id_cuota=cuota_id and p.fecha>p_fecha)
 then raise exception 'FECHA_PAGO_INVALIDA'; end if;
 mora:=q.mora_devengada+(q.capital+q.interes-q.capital_pagado-q.interes_pagado)*c.tasa_mora_diaria*greatest(0,p_fecha-q.mora_hasta);
 exigible:=q.capital+q.interes-q.capital_pagado-q.interes_pagado+mora-q.mora_pagada;
 if exigible<=0 or monto>round(exigible,2)+0.005 then raise exception 'PAGO_EXCEDE_DEUDA'; end if;
 if not (select permite_pagos_parciales from public.bazares where id_bazar=b) and monto<>round(exigible,2) then raise exception 'PAGO_PARCIAL_NO_PERMITIDO'; end if;
 disponible:=case when monto=round(exigible,2) then exigible else monto end;
 ajuste:=monto-disponible;
 am:=least(disponible,mora-q.mora_pagada); disponible:=disponible-am;
 ai:=least(disponible,q.interes-q.interes_pagado); disponible:=disponible-ai;
 ac:=least(disponible,q.capital-q.capital_pagado);
 insert into public.pagos(id_bazar,id_cliente,fecha,monto,moneda,medio,idempotencia,id_usuario_registro,ajuste_redondeo)
 values(b,c.id_cliente,p_fecha,monto,c.moneda,medio,clave,auth.uid(),ajuste) returning id_pago into pago;
 insert into public.aplicaciones_pago(id_bazar,id_pago,id_cuota,mora,interes,capital) values(b,pago,cuota_id,am,ai,ac);
 update public.cuotas set capital_pagado=capital_pagado+ac,interes_pagado=interes_pagado+ai,mora_devengada=mora,mora_pagada=mora_pagada+am,mora_hasta=greatest(q.mora_hasta,p_fecha) where id_cuota=cuota_id;
 insert into public.movimientos_caja(id_bazar,fecha,tipo,concepto,monto,moneda,id_pago,idempotencia,id_usuario_registro) values(b,p_fecha,'INGRESO','Cobranza',monto,c.moneda,pago,clave,auth.uid());
 perform mibazar_privado.registrar_evento(b,'COBRAR','pagos',pago,jsonb_build_object('monto',monto,'redondeo',ajuste));
 return pago;
end $$;

create function mibazar_privado.motor_compra(b uuid,proveedor text,items jsonb,modalidad text,fecha date,vence date,clave uuid) returns uuid
language plpgsql set search_path='' as $$
declare compra uuid; total numeric:=0; item record; prod public.productos;
begin
 if items is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 100 or fecha is null or fecha>(now() at time zone 'America/Lima')::date or vence<fecha or clave is null or modalidad not in ('CONTADO','CREDITO') or nullif(trim(proveedor),'') is null then raise exception 'COMPRA_INVALIDA'; end if;
 perform pg_advisory_xact_lock(hashtextextended(b::text,0));
 select id_compra into compra from public.compras where id_bazar=b and idempotencia=clave;
 if compra is not null then return compra; end if;
 for item in select * from jsonb_to_recordset(items) as x(id_producto uuid,cantidad integer,costo numeric) order by id_producto loop
  if item.cantidad is null or item.cantidad<=0 or item.costo is null or item.costo<=0 then raise exception 'DETALLE_INVALIDO'; end if;
  perform 1 from public.productos where id_bazar=b and id_producto=item.id_producto for update;
  if not found then raise exception 'PRODUCTO_INACCESIBLE'; end if;
  total:=total+item.cantidad*item.costo;
 end loop;
 insert into public.compras(id_bazar,proveedor,fecha,vencimiento,modalidad,total,idempotencia,id_usuario_registro) values(b,proveedor,fecha,vence,modalidad,total,clave,auth.uid()) returning id_compra into compra;
 for item in select * from jsonb_to_recordset(items) as x(id_producto uuid,cantidad integer,costo numeric) order by id_producto loop
  select * into prod from public.productos where id_producto=item.id_producto;
  insert into public.detalle_compras(id_bazar,id_compra,id_producto,cantidad,costo_unitario) values(b,compra,item.id_producto,item.cantidad,item.costo);
  insert into public.movimientos_inventario(id_bazar,id_producto,fecha,tipo,cantidad,stock_anterior,stock_resultante,id_compra,motivo,id_usuario_registro)
  values(b,item.id_producto,(fecha+time '08:00') at time zone 'America/Lima','COMPRA',item.cantidad,prod.stock_actual,prod.stock_actual+item.cantidad,compra,'Compra a proveedor',auth.uid());
  update public.productos set stock_actual=stock_actual+item.cantidad where id_producto=item.id_producto;
 end loop;
 if modalidad='CONTADO' then
  insert into public.movimientos_caja(id_bazar,fecha,tipo,concepto,monto,moneda,id_compra,idempotencia,id_usuario_registro) values(b,fecha,'EGRESO','Compra al contado',total,'PEN',compra,clave,auth.uid());
 end if;
 perform mibazar_privado.registrar_evento(b,'COMPRAR','compras',compra,jsonb_build_object('total',total));
 return compra;
end $$;

create function mibazar_privado.motor_liquidar(b uuid,hasta timestamptz) returns integer language plpgsql set search_path='' as $$
declare r record; liq uuid; n integer:=0;
begin
 for r in select c.id_cliente,c.fecha_corte,c.moneda,max(q.vencimiento) vencimiento,sum(q.capital) capital,sum(q.interes) interes
 from public.creditos c join public.cuotas q using(id_credito)
 where c.id_bazar=b and c.modalidad='FIN_DE_MES' and c.fecha_corte<=hasta
 group by c.id_cliente,c.fecha_corte,c.moneda loop
  insert into public.liquidaciones(id_bazar,id_cliente,corte,vencimiento,moneda,capital,interes) values(b,r.id_cliente,r.fecha_corte,r.vencimiento,r.moneda,r.capital,r.interes)
  on conflict(id_bazar,id_cliente,corte,moneda) do nothing returning id_liquidacion into liq;
  if liq is not null then
   insert into public.detalle_liquidaciones(id_bazar,id_liquidacion,id_credito) select b,liq,id_credito from public.creditos where id_bazar=b and id_cliente=r.id_cliente and fecha_corte=r.fecha_corte and modalidad='FIN_DE_MES' and moneda=r.moneda;
   perform mibazar_privado.registrar_evento(b,'LIQUIDAR','liquidaciones',liq); n:=n+1;
  end if;
 end loop;
 return n;
end $$;

create function mibazar_privado.registrar_venta_seguro(p_bazar uuid,p_cliente uuid,p_items jsonb,p_modalidad text,p_cuotas integer,p_gracia integer,p_clave uuid) returns uuid language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO' using errcode='42501'; end if;
 return mibazar_privado.motor_venta(p_bazar,p_cliente,p_items,p_modalidad,p_cuotas,p_gracia,p_clave,now());
 end $$;
create function public.registrar_venta(p_bazar uuid,p_cliente uuid,p_items jsonb,p_modalidad text,p_cuotas integer,p_gracia integer,p_clave uuid) returns uuid language sql security invoker set search_path='' as $$ select mibazar_privado.registrar_venta_seguro(p_bazar,p_cliente,p_items,p_modalidad,p_cuotas,p_gracia,p_clave) $$;

create function mibazar_privado.registrar_pago_seguro(p_bazar uuid,p_cuota uuid,p_monto numeric,p_clave uuid,p_medio text default 'EFECTIVO') returns uuid language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO' using errcode='42501'; end if;
 return mibazar_privado.motor_pago(p_bazar,p_cuota,p_monto,p_clave,(now() at time zone 'America/Lima')::date,p_medio);
 end $$;
create function public.registrar_pago(p_bazar uuid,p_cuota uuid,p_monto numeric,p_clave uuid,p_medio text default 'EFECTIVO') returns uuid language sql security invoker set search_path='' as $$ select mibazar_privado.registrar_pago_seguro(p_bazar,p_cuota,p_monto,p_clave,p_medio) $$;

create function mibazar_privado.registrar_compra_seguro(p_bazar uuid,p_proveedor text,p_items jsonb,p_modalidad text,p_vencimiento date,p_clave uuid) returns uuid language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO' using errcode='42501'; end if;
 return mibazar_privado.motor_compra(p_bazar,p_proveedor,p_items,p_modalidad,(now() at time zone 'America/Lima')::date,p_vencimiento,p_clave);
 end $$;
create function public.registrar_compra(p_bazar uuid,p_proveedor text,p_items jsonb,p_modalidad text,p_vencimiento date,p_clave uuid) returns uuid language sql security invoker set search_path='' as $$ select mibazar_privado.registrar_compra_seguro(p_bazar,p_proveedor,p_items,p_modalidad,p_vencimiento,p_clave) $$;

create function mibazar_privado.liquidar_fin_mes_seguro(p_bazar uuid) returns integer language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO' using errcode='42501'; end if;
 return mibazar_privado.motor_liquidar(p_bazar,now());
 end $$;
create function public.liquidar_fin_mes(p_bazar uuid) returns integer language sql security invoker set search_path='' as $$ select mibazar_privado.liquidar_fin_mes_seguro(p_bazar) $$;

create function mibazar_privado.pagar_compra_seguro(p_bazar uuid,p_compra uuid,p_monto numeric,p_clave uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare c public.compras; pagado numeric; movimiento uuid;
begin
 if auth.uid() is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO' using errcode='42501'; end if;
 if p_monto is null or p_monto<=0 or p_clave is null then raise exception 'PAGO_INVALIDO'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_bazar::text,0));
 select id_movimiento into movimiento from public.movimientos_caja where id_bazar=p_bazar and idempotencia=p_clave;
 if movimiento is not null then return movimiento; end if;
 select * into c from public.compras where id_bazar=p_bazar and id_compra=p_compra for update;
 if not found then raise exception 'COMPRA_INACCESIBLE'; end if;
 select coalesce(sum(monto),0) into pagado from public.movimientos_caja where id_compra=p_compra and tipo='EGRESO';
 if p_monto>c.total-pagado then raise exception 'PAGO_EXCEDE_DEUDA'; end if;
 insert into public.movimientos_caja(id_bazar,fecha,tipo,concepto,monto,moneda,id_compra,idempotencia,id_usuario_registro)
 values(p_bazar,(now() at time zone 'America/Lima')::date,'EGRESO','Pago a proveedor',p_monto,c.moneda,p_compra,p_clave,auth.uid()) returning id_movimiento into movimiento;
 perform mibazar_privado.registrar_evento(p_bazar,'PAGAR_PROVEEDOR','movimientos_caja',movimiento);
 return movimiento;
end $$;
create function public.pagar_compra(p_bazar uuid,p_compra uuid,p_monto numeric,p_clave uuid) returns uuid language sql security invoker set search_path='' as $$ select mibazar_privado.pagar_compra_seguro(p_bazar,p_compra,p_monto,p_clave) $$;

-- Master data: only a verified owner can maintain catalog, commercial customers and terms.
grant insert(id_bazar,codigo_sku,nombre,descripcion,marca,categoria,proveedor,unidad_medida,precio_contado,precio_credito,imagen_url,stock_minimo,permite_fin_mes,permite_cuotas,estado),
update(nombre,descripcion,marca,categoria,proveedor,unidad_medida,precio_contado,precio_credito,imagen_url,stock_minimo,permite_fin_mes,permite_cuotas,estado) on public.productos to authenticated;
create policy productos_alta on public.productos for insert to authenticated with check(mibazar_privado.puede_gestionar(id_bazar) and stock_actual=0);
create policy productos_edicion on public.productos for update to authenticated using(mibazar_privado.puede_gestionar(id_bazar)) with check(mibazar_privado.puede_gestionar(id_bazar));
grant insert(id_bazar,nombre_completo,tipo_documento,numero_documento,correo,telefono,direccion,consentimiento_fecha),
update(nombre_completo,correo,telefono,direccion,estado_registro,estado_crediticio) on public.clientes to authenticated;
create policy clientes_alta on public.clientes for insert to authenticated with check(mibazar_privado.puede_gestionar(id_bazar) and consentimiento_fecha is not null and id_usuario is null);
create policy clientes_edicion on public.clientes for update to authenticated using(mibazar_privado.puede_gestionar(id_bazar)) with check(mibazar_privado.puede_gestionar(id_bazar));
grant insert(id_cliente,moneda,linea_credito_max,tipo_tasa_compensatoria,tasa_compensatoria,capitalizacion_compensatoria,tipo_tasa_moratoria,tasa_moratoria,capitalizacion_moratoria,dia_corte,hora_corte,dia_pago,plazo_maximo_meses,activo),
update(linea_credito_max,tipo_tasa_compensatoria,tasa_compensatoria,capitalizacion_compensatoria,tipo_tasa_moratoria,tasa_moratoria,capitalizacion_moratoria,dia_corte,hora_corte,dia_pago,plazo_maximo_meses,activo) on public.configuraciones_credito to authenticated;
create policy config_alta on public.configuraciones_credito for insert to authenticated with check(exists(select 1 from public.clientes c where c.id_cliente=configuraciones_credito.id_cliente and mibazar_privado.puede_gestionar(c.id_bazar)));
create policy config_edicion on public.configuraciones_credito for update to authenticated using(exists(select 1 from public.clientes c where c.id_cliente=configuraciones_credito.id_cliente and mibazar_privado.puede_gestionar(c.id_bazar))) with check(exists(select 1 from public.clientes c where c.id_cliente=configuraciones_credito.id_cliente and mibazar_privado.puede_gestionar(c.id_bazar)));

-- All internal engines remain inaccessible to API callers.
revoke all on all functions in schema mibazar_privado from public,anon,authenticated;
grant execute on function mibazar_privado.es_superadmin(),mibazar_privado.puede_gestionar(uuid),mibazar_privado.es_cliente(uuid,uuid) to authenticated;

revoke execute on function public.registrar_venta(uuid,uuid,jsonb,text,integer,integer,uuid) from public,anon;
grant execute on function public.registrar_venta(uuid,uuid,jsonb,text,integer,integer,uuid),mibazar_privado.registrar_venta_seguro(uuid,uuid,jsonb,text,integer,integer,uuid) to authenticated;

revoke execute on function public.registrar_pago(uuid,uuid,numeric,uuid,text) from public,anon;
grant execute on function public.registrar_pago(uuid,uuid,numeric,uuid,text),mibazar_privado.registrar_pago_seguro(uuid,uuid,numeric,uuid,text) to authenticated;

revoke execute on function public.registrar_compra(uuid,text,jsonb,text,date,uuid) from public,anon;
grant execute on function public.registrar_compra(uuid,text,jsonb,text,date,uuid),mibazar_privado.registrar_compra_seguro(uuid,text,jsonb,text,date,uuid) to authenticated;

revoke execute on function public.liquidar_fin_mes(uuid) from public,anon;
grant execute on function public.liquidar_fin_mes(uuid),mibazar_privado.liquidar_fin_mes_seguro(uuid) to authenticated;

revoke execute on function public.pagar_compra(uuid,uuid,numeric,uuid) from public,anon;
grant execute on function public.pagar_compra(uuid,uuid,numeric,uuid),mibazar_privado.pagar_compra_seguro(uuid,uuid,numeric,uuid) to authenticated;




-- Deterministic synthetic scenarios. No real customer records or Auth accounts.
-- Run explicitly; never on application startup. Re-running an existing lot is a no-op.
do $$
declare lote uuid; b uuid; c uuid; p uuid; venta uuid; compra uuid; q record; j integer; k integer; z integer;
 clientes uuid[]; productos uuid[]; ref date:=(now() at time zone 'America/Lima')::date;
 inicio date; f date; modalidad text; n integer; unidades integer; previo integer; deseado integer;
begin
 select id_lote into lote from public.demo_lotes where codigo='MIBAZAR_DEMO_V1';
 if lote is not null then raise notice 'DEMO already exists; no rows changed'; return; end if;
 inicio:=ref-270;
 insert into public.demo_lotes(codigo,descripcion,fecha_referencia)
 values('MIBAZAR_DEMO_V1','Datos sintéticos académicos; 4 bazares, 200 clientes, 320 productos y 800 ventas; no representan personas o comercios reales.',ref) returning id_lote into lote;
 for z in 1..4 loop
  insert into public.bazares(ruc,razon_social,nombre_comercial,direccion,distrito,provincia,departamento,id_lote_demo,permite_pagos_parciales)
  values('0000000'||lpad(z::text,4,'0'),'DEMO MiBazar '||z,'DEMO · Bazar '||z,'Dirección ficticia DEMO','DEMO','DEMO','DEMO',lote,true) returning id_bazar into b;
  clientes:='{}'; productos:='{}';
  for j in 1..50 loop
   insert into public.clientes(id_bazar,nombre_completo,tipo_documento,numero_documento,consentimiento_fecha,created_at)
   values(b,'Cliente DEMO '||z||'-'||lpad(j::text,3,'0'),'DNI',lpad((z*1000+j)::text,8,'0'),(inicio::timestamp at time zone 'America/Lima'),(inicio::timestamp at time zone 'America/Lima')) returning id_cliente into c;
   clientes:=array_append(clientes,c);
   insert into public.configuraciones_credito(id_cliente,linea_credito_max,tipo_tasa_compensatoria,tasa_compensatoria,capitalizacion_compensatoria,tasa_moratoria,plazo_maximo_meses)
   values(c,1000+j*100,case when j%2=0 then 'TNA' else 'TEA' end,0.18+(j%5)*0.03,case when j%2=0 then 'MENSUAL' else null end,0.36,12);
  end loop;
  for j in 1..80 loop
   insert into public.productos(id_bazar,codigo_sku,nombre,categoria,precio_contado,precio_credito,stock_actual,stock_minimo,created_at)
   values(b,'DEMO-'||lpad(j::text,3,'0'),(array['Cuaderno','Lapicero','Archivador','Regalo','Accesorio'])[1+j%5]||' DEMO '||j,
   (array['Papelería','Útiles de oficina','Regalos','Hogar'])[1+j%4],5+j*1.25,(5+j*1.25)*1.10,0,5,(inicio::timestamp at time zone 'America/Lima')) returning id_producto into p;
   productos:=array_append(productos,p);
   compra:=mibazar_privado.motor_compra(b,'Proveedor DEMO '||z||'-'||(1+j%6),
    jsonb_build_array(jsonb_build_object('id_producto',p,'cantidad',100,'costo',round((5+j*1.25)*0.60,2))),
    case when j%3=0 then 'CREDITO' else 'CONTADO' end,inicio,inicio+30,gen_random_uuid());
  end loop;
  for j in 1..200 loop
   c:=clientes[1+(j-1)%50]; p:=productos[1+(j-1)%60];
   f:=inicio+floor((j-1)*270.0/199)::int;
   modalidad:=(array['CONTADO','FIN_DE_MES','EN_CUOTAS'])[1+j%3];
   n:=case when modalidad='EN_CUOTAS' then case when j<=150 then 2 else 6 end else 1 end;
   venta:=mibazar_privado.motor_venta(b,c,jsonb_build_array(jsonb_build_object('id_producto',p,'cantidad',1+j%4)),modalidad,n,case when modalidad='EN_CUOTAS' then j%6 else 0 end,gen_random_uuid(),least(now(),(f+time '10:00') at time zone 'America/Lima'));
   if modalidad<>'CONTADO' then
    for q in select cuota_demo.* from public.cuotas cuota_demo join public.creditos cr using(id_credito) where cr.id_venta=venta order by cuota_demo.numero loop
     if j<=150 and q.vencimiento<=ref then
      perform mibazar_privado.motor_pago(b,q.id_cuota,round(q.importe,2),gen_random_uuid(),q.vencimiento);
     elsif j>150 and j%4=0 and q.vencimiento<=ref then
      perform mibazar_privado.motor_pago(b,q.id_cuota,round(q.importe,2),gen_random_uuid(),q.vencimiento);
     elsif j>150 and j%4=1 and q.numero=1 and q.vencimiento<=ref then
      perform mibazar_privado.motor_pago(b,q.id_cuota,round(q.importe/2,2),gen_random_uuid(),q.vencimiento);
     end if;
    end loop;
   end if;
  end loop;
  -- Recent purchases provide upcoming payables without fabricating cash entries.
  for j in 1..12 loop
   compra:=mibazar_privado.motor_compra(b,'Proveedor DEMO próximo '||j,
   jsonb_build_array(jsonb_build_object('id_producto',productos[60+j],'cantidad',20,'costo',10+j)),
   'CREDITO',ref-j,ref+case when j%3=0 then -1 else j end,gen_random_uuid());
  end loop;
  -- Auditable count adjustments create explicit normal / low / zero-stock scenarios.
  for j in 65..80 loop
   p:=productos[j]; select stock_actual into previo from public.productos where id_producto=p;
   deseado:=case when j%2=0 then 0 else 3 end;
   insert into public.movimientos_inventario(id_bazar,id_producto,fecha,tipo,cantidad,stock_anterior,stock_resultante,motivo)
   values(b,p,now(),'AJUSTE_SALIDA',previo-deseado,previo,deseado,'Conteo sintético del escenario DEMO');
   update public.productos set stock_actual=deseado where id_producto=p;
   insert into public.notificaciones(id_bazar,tipo,mensaje,clave) values(b,'STOCK_BAJO','Stock bajo de producto DEMO','stock:'||p) on conflict do nothing;
  end loop;
  perform mibazar_privado.motor_liquidar(b,now());
  insert into public.notificaciones(id_bazar,id_cliente,tipo,mensaje,clave)
  select b,c.id_cliente,case when min(x.vencimiento)<ref then 'MORA' else 'VENCIMIENTO' end,'Revisar obligaciones del cliente DEMO','cartera:'||c.id_cliente
  from public.clientes c join public.cuentas_por_cobrar x using(id_cliente) where c.id_bazar=b and x.saldo>0 group by c.id_cliente;
 end loop;
end $$;


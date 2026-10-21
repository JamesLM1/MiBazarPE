-- MiBazarPE: incremental core. No existing rows are deleted or rewritten.
create schema if not exists mibazar_privado;
revoke all on schema mibazar_privado from public, anon;
grant usage on schema mibazar_privado to authenticated;
create table public.demo_lotes (
 id_lote uuid primary key default gen_random_uuid(), codigo text not null unique,
 descripcion text not null, fecha_referencia date not null, created_at timestamptz not null default now()
);
alter table public.bazares add column id_lote_demo uuid references public.demo_lotes(id_lote);
alter table public.bazares add column permite_pagos_parciales boolean not null default false;
alter table public.clientes add column consentimiento_fecha timestamptz;
alter table public.clientes add constraint clientes_bazar_id_unique unique(id_bazar,id_cliente);
alter table public.productos add constraint productos_bazar_id_unique unique(id_bazar,id_producto);

create function mibazar_privado.es_superadmin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.perfiles where id=auth.uid() and rol='SUPERADMIN' and estado='ACTIVO')
$$;
create function mibazar_privado.puede_gestionar(b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.bazares z where z.id_bazar=b and z.estado='ACTIVO')
 and (mibazar_privado.es_superadmin() or exists(
 select 1 from public.usuarios_bazar u join public.perfiles p on p.id=u.id_usuario
 where u.id_bazar=b and u.id_usuario=auth.uid() and u.estado='ACTIVO' and u.rol_bazar='PROPIETARIO' and p.estado='ACTIVO' and p.rol='DUENO_BAZAR'))
$$;
create function mibazar_privado.es_cliente(b uuid,c uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.clientes x join public.perfiles p on p.id=x.id_usuario join public.bazares z on z.id_bazar=x.id_bazar
 where x.id_cliente=c and x.id_bazar=b and x.id_usuario=auth.uid() and p.estado='ACTIVO' and p.rol='CLIENTE' and z.estado='ACTIVO')
$$;

create table public.ventas (
 id_venta uuid primary key default gen_random_uuid(), id_bazar uuid not null references public.bazares(id_bazar),
 id_cliente uuid, fecha timestamptz not null default now(), modalidad text not null check(modalidad in ('CONTADO','FIN_DE_MES','EN_CUOTAS')),
 moneda text not null default 'PEN' check(moneda in ('PEN','USD')), total numeric not null check(total>0),
 estado text not null default 'CONFIRMADA' check(estado in ('CONFIRMADA','ANULADA')),
 idempotencia uuid not null, id_usuario_registro uuid references auth.users(id), created_at timestamptz not null default now(),
 unique(id_bazar,id_venta), unique(id_bazar,idempotencia), foreign key(id_bazar,id_cliente) references public.clientes(id_bazar,id_cliente),
 check(modalidad='CONTADO' or id_cliente is not null)
);
create table public.detalle_ventas (
 id_detalle uuid primary key default gen_random_uuid(), id_bazar uuid not null, id_venta uuid not null, id_producto uuid not null,
 cantidad integer not null check(cantidad between 1 and 500), precio_unitario numeric not null check(precio_unitario>0),
 subtotal numeric generated always as (cantidad*precio_unitario) stored,
 foreign key(id_bazar,id_venta) references public.ventas(id_bazar,id_venta),
 foreign key(id_bazar,id_producto) references public.productos(id_bazar,id_producto),
 unique(id_venta,id_producto)
);
create table public.creditos (
 id_credito uuid primary key default gen_random_uuid(), id_bazar uuid not null, id_cliente uuid not null, id_venta uuid not null unique,
 modalidad text not null check(modalidad in ('FIN_DE_MES','EN_CUOTAS')),
 capital_original numeric not null check(capital_original>0), capital_financiado numeric not null check(capital_financiado>=capital_original),
 moneda text not null check(moneda in ('PEN','USD')), numero_cuotas integer not null check(numero_cuotas between 1 and 12),
 dias_gracia integer not null check(dias_gracia between 0 and 30),
 tasa_mensual numeric not null check(tasa_mensual>=0), tasa_diaria numeric not null check(tasa_diaria>=0),
 tasa_mora_diaria numeric not null check(tasa_mora_diaria>=0), parametros jsonb not null,
 fecha_corte timestamptz not null, created_at timestamptz not null default now(),
 unique(id_bazar,id_credito),
 foreign key(id_bazar,id_venta) references public.ventas(id_bazar,id_venta),
 foreign key(id_bazar,id_cliente) references public.clientes(id_bazar,id_cliente)
);
create table public.cuotas (
 id_cuota uuid primary key default gen_random_uuid(), id_bazar uuid not null, id_credito uuid not null, numero integer not null check(numero>0),
 vencimiento date not null, saldo_inicial numeric not null check(saldo_inicial>0), interes numeric not null check(interes>=0),
 capital numeric not null check(capital>0), importe numeric not null check(importe=capital+interes),
 saldo_final numeric not null check(saldo_final>=0),
 capital_pagado numeric not null default 0 check(capital_pagado>=0 and capital_pagado<=capital),
 interes_pagado numeric not null default 0 check(interes_pagado>=0 and interes_pagado<=interes),
 mora_devengada numeric not null default 0 check(mora_devengada>=0), mora_pagada numeric not null default 0 check(mora_pagada>=0 and mora_pagada<=mora_devengada),
 mora_hasta date not null, unique(id_credito,numero), unique(id_bazar,id_cuota),
 foreign key(id_bazar,id_credito) references public.creditos(id_bazar,id_credito)
);
create table public.pagos (
 id_pago uuid primary key default gen_random_uuid(), id_bazar uuid not null, id_cliente uuid not null,
 fecha date not null, monto numeric not null check(monto>0), moneda text not null check(moneda in ('PEN','USD')),
 medio text not null default 'EFECTIVO' check(medio in ('EFECTIVO','TRANSFERENCIA','TARJETA','YAPE','PLIN')),
 idempotencia uuid not null, id_usuario_registro uuid references auth.users(id), created_at timestamptz not null default now(),
 unique(id_bazar,id_pago), unique(id_bazar,idempotencia),
 foreign key(id_bazar,id_cliente) references public.clientes(id_bazar,id_cliente)
);
create table public.aplicaciones_pago (
 id_aplicacion uuid primary key default gen_random_uuid(), id_bazar uuid not null, id_pago uuid not null, id_cuota uuid not null,
 mora numeric not null check(mora>=0), interes numeric not null check(interes>=0), capital numeric not null check(capital>=0),
 total numeric generated always as(mora+interes+capital) stored, check(mora+interes+capital>0), unique(id_pago,id_cuota),
 foreign key(id_bazar,id_pago) references public.pagos(id_bazar,id_pago),
 foreign key(id_bazar,id_cuota) references public.cuotas(id_bazar,id_cuota)
);
create table public.liquidaciones (
 id_liquidacion uuid primary key default gen_random_uuid(), id_bazar uuid not null, id_cliente uuid not null,
 corte timestamptz not null, vencimiento date not null, moneda text not null,
 capital numeric not null check(capital>=0), interes numeric not null check(interes>=0),
 created_at timestamptz not null default now(), unique(id_bazar,id_cliente,corte,moneda), unique(id_bazar,id_liquidacion),
 foreign key(id_bazar,id_cliente) references public.clientes(id_bazar,id_cliente)
);
create table public.detalle_liquidaciones (
 id_bazar uuid not null, id_liquidacion uuid not null, id_credito uuid not null unique,
 primary key(id_liquidacion,id_credito),
 foreign key(id_bazar,id_liquidacion) references public.liquidaciones(id_bazar,id_liquidacion),
 foreign key(id_bazar,id_credito) references public.creditos(id_bazar,id_credito)
);
create table public.compras (
 id_compra uuid primary key default gen_random_uuid(), id_bazar uuid not null references public.bazares(id_bazar),
 proveedor text not null, fecha date not null, vencimiento date not null, modalidad text not null check(modalidad in ('CONTADO','CREDITO')),
 moneda text not null default 'PEN' check(moneda in ('PEN','USD')), total numeric not null check(total>0),
 idempotencia uuid not null, id_usuario_registro uuid references auth.users(id), unique(id_bazar,id_compra), unique(id_bazar,idempotencia), check(vencimiento>=fecha)
);
create table public.detalle_compras (
 id_detalle uuid primary key default gen_random_uuid(), id_bazar uuid not null, id_compra uuid not null, id_producto uuid not null,
 cantidad integer not null check(cantidad>0), costo_unitario numeric not null check(costo_unitario>0),
 subtotal numeric generated always as(cantidad*costo_unitario) stored,
 foreign key(id_bazar,id_compra) references public.compras(id_bazar,id_compra),
 foreign key(id_bazar,id_producto) references public.productos(id_bazar,id_producto), unique(id_compra,id_producto)
);
create table public.movimientos_inventario (
 id_movimiento uuid primary key default gen_random_uuid(), id_bazar uuid not null, id_producto uuid not null,
 fecha timestamptz not null default now(), tipo text not null check(tipo in ('APERTURA','COMPRA','VENTA','AJUSTE_ENTRADA','AJUSTE_SALIDA')),
 cantidad integer not null check(cantidad>0), stock_anterior integer not null check(stock_anterior>=0), stock_resultante integer not null check(stock_resultante>=0),
 id_venta uuid, id_compra uuid, motivo text not null, id_usuario_registro uuid references auth.users(id),
 foreign key(id_bazar,id_producto) references public.productos(id_bazar,id_producto),
 foreign key(id_bazar,id_venta) references public.ventas(id_bazar,id_venta),
 foreign key(id_bazar,id_compra) references public.compras(id_bazar,id_compra),
 check(stock_resultante=stock_anterior+case when tipo in ('VENTA','AJUSTE_SALIDA') then -cantidad else cantidad end)
);
create table public.movimientos_caja (
 id_movimiento uuid primary key default gen_random_uuid(), id_bazar uuid not null references public.bazares(id_bazar),
 fecha date not null, tipo text not null check(tipo in ('INGRESO','EGRESO')), concepto text not null,
 monto numeric not null check(monto>0), moneda text not null check(moneda in ('PEN','USD')),
 id_venta uuid, id_pago uuid, id_compra uuid, idempotencia uuid not null,
 id_usuario_registro uuid references auth.users(id), unique(id_bazar,idempotencia),
 foreign key(id_bazar,id_venta) references public.ventas(id_bazar,id_venta),
 foreign key(id_bazar,id_pago) references public.pagos(id_bazar,id_pago),
 foreign key(id_bazar,id_compra) references public.compras(id_bazar,id_compra),
 check(num_nonnulls(id_venta,id_pago,id_compra)=1)
);
create table public.notificaciones (
 id_notificacion uuid primary key default gen_random_uuid(), id_bazar uuid not null references public.bazares(id_bazar),
 id_cliente uuid, tipo text not null check(tipo in ('STOCK_BAJO','VENCIMIENTO','MORA')), mensaje text not null,
 clave text not null, created_at timestamptz not null default now(), unique(id_bazar,clave),
 foreign key(id_bazar,id_cliente) references public.clientes(id_bazar,id_cliente)
);
create table public.auditoria (
 id_evento uuid primary key default gen_random_uuid(), id_bazar uuid not null references public.bazares(id_bazar),
 id_usuario uuid references auth.users(id), accion text not null, entidad text not null, id_registro uuid not null,
 datos jsonb not null default '{}', created_at timestamptz not null default now()
);

-- Revoke dangerous legacy grants; existing SELECT grants are preserved.
revoke truncate,references,trigger on public.perfiles,public.usuarios_bazar,public.bazares,public.configuraciones_credito,public.productos,public.clientes from anon,authenticated;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
revoke all on all functions in schema mibazar_privado from public,anon;
grant execute on function mibazar_privado.es_superadmin(),mibazar_privado.puede_gestionar(uuid),mibazar_privado.es_cliente(uuid,uuid) to authenticated;

create policy perfil_superadmin on public.perfiles for select to authenticated using(mibazar_privado.es_superadmin());
create policy membresia_guard on public.usuarios_bazar as restrictive for select to authenticated using(exists(select 1 from public.perfiles p where p.id=auth.uid() and p.estado='ACTIVO'));
create policy bazar_guard on public.bazares as restrictive for select to authenticated using(mibazar_privado.puede_gestionar(id_bazar));
create policy bazar_admin on public.bazares for select to authenticated using(mibazar_privado.es_superadmin());
create policy productos_guard on public.productos as restrictive for select to authenticated using(mibazar_privado.puede_gestionar(id_bazar));
create policy productos_admin on public.productos for select to authenticated using(mibazar_privado.es_superadmin());
create policy clientes_guard on public.clientes as restrictive for select to authenticated using(mibazar_privado.puede_gestionar(id_bazar) or mibazar_privado.es_cliente(id_bazar,id_cliente));
create policy clientes_lectura on public.clientes for select to authenticated using(mibazar_privado.puede_gestionar(id_bazar) or mibazar_privado.es_cliente(id_bazar,id_cliente));
grant select on public.configuraciones_credito to authenticated;
create policy config_lectura on public.configuraciones_credito for select to authenticated using(exists(select 1 from public.clientes c where c.id_cliente=configuraciones_credito.id_cliente));

alter table public.ventas enable row level security;
revoke all on public.ventas from anon,authenticated;
grant select on public.ventas to authenticated;
create policy lectura_autorizada on public.ventas for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar) or mibazar_privado.es_cliente(id_bazar,id_cliente));
create index idx_ventas_bazar on public.ventas(id_bazar);

alter table public.creditos enable row level security;
revoke all on public.creditos from anon,authenticated;
grant select on public.creditos to authenticated;
create policy lectura_autorizada on public.creditos for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar) or mibazar_privado.es_cliente(id_bazar,id_cliente));
create index idx_creditos_bazar on public.creditos(id_bazar);

alter table public.pagos enable row level security;
revoke all on public.pagos from anon,authenticated;
grant select on public.pagos to authenticated;
create policy lectura_autorizada on public.pagos for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar) or mibazar_privado.es_cliente(id_bazar,id_cliente));
create index idx_pagos_bazar on public.pagos(id_bazar);

alter table public.liquidaciones enable row level security;
revoke all on public.liquidaciones from anon,authenticated;
grant select on public.liquidaciones to authenticated;
create policy lectura_autorizada on public.liquidaciones for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar) or mibazar_privado.es_cliente(id_bazar,id_cliente));
create index idx_liquidaciones_bazar on public.liquidaciones(id_bazar);

alter table public.compras enable row level security;
revoke all on public.compras from anon,authenticated;
grant select on public.compras to authenticated;
create policy lectura_autorizada on public.compras for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar));
create index idx_compras_bazar on public.compras(id_bazar);

alter table public.detalle_compras enable row level security;
revoke all on public.detalle_compras from anon,authenticated;
grant select on public.detalle_compras to authenticated;
create policy lectura_autorizada on public.detalle_compras for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar));
create index idx_detalle_compras_bazar on public.detalle_compras(id_bazar);

alter table public.movimientos_inventario enable row level security;
revoke all on public.movimientos_inventario from anon,authenticated;
grant select on public.movimientos_inventario to authenticated;
create policy lectura_autorizada on public.movimientos_inventario for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar));
create index idx_movimientos_inventario_bazar on public.movimientos_inventario(id_bazar);

alter table public.movimientos_caja enable row level security;
revoke all on public.movimientos_caja from anon,authenticated;
grant select on public.movimientos_caja to authenticated;
create policy lectura_autorizada on public.movimientos_caja for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar));
create index idx_movimientos_caja_bazar on public.movimientos_caja(id_bazar);

alter table public.auditoria enable row level security;
revoke all on public.auditoria from anon,authenticated;
grant select on public.auditoria to authenticated;
create policy lectura_autorizada on public.auditoria for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar));
create index idx_auditoria_bazar on public.auditoria(id_bazar);

alter table public.detalle_ventas enable row level security;
revoke all on public.detalle_ventas from anon,authenticated;
grant select on public.detalle_ventas to authenticated;
create policy lectura_autorizada on public.detalle_ventas for select to authenticated using (exists(select 1 from public.ventas v where v.id_venta=detalle_ventas.id_venta));
create index idx_detalle_ventas_bazar on public.detalle_ventas(id_bazar);

alter table public.cuotas enable row level security;
revoke all on public.cuotas from anon,authenticated;
grant select on public.cuotas to authenticated;
create policy lectura_autorizada on public.cuotas for select to authenticated using (exists(select 1 from public.creditos c where c.id_credito=cuotas.id_credito));
create index idx_cuotas_bazar on public.cuotas(id_bazar);

alter table public.aplicaciones_pago enable row level security;
revoke all on public.aplicaciones_pago from anon,authenticated;
grant select on public.aplicaciones_pago to authenticated;
create policy lectura_autorizada on public.aplicaciones_pago for select to authenticated using (exists(select 1 from public.pagos p where p.id_pago=aplicaciones_pago.id_pago));
create index idx_aplicaciones_pago_bazar on public.aplicaciones_pago(id_bazar);

alter table public.detalle_liquidaciones enable row level security;
revoke all on public.detalle_liquidaciones from anon,authenticated;
grant select on public.detalle_liquidaciones to authenticated;
create policy lectura_autorizada on public.detalle_liquidaciones for select to authenticated using (exists(select 1 from public.liquidaciones l where l.id_liquidacion=detalle_liquidaciones.id_liquidacion));
create index idx_detalle_liquidaciones_bazar on public.detalle_liquidaciones(id_bazar);

alter table public.notificaciones enable row level security;
revoke all on public.notificaciones from anon,authenticated;
grant select on public.notificaciones to authenticated;
create policy lectura_autorizada on public.notificaciones for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar) or mibazar_privado.es_cliente(id_bazar,id_cliente));
create index idx_notificaciones_bazar on public.notificaciones(id_bazar);

alter table public.demo_lotes enable row level security;
revoke all on public.demo_lotes from anon,authenticated;
grant select on public.demo_lotes to authenticated;
create policy lectura_autorizada on public.demo_lotes for select to authenticated using (exists(select 1 from public.bazares b where b.id_lote_demo=demo_lotes.id_lote));

create index idx_ventas_fecha on public.ventas(id_bazar,fecha);
create index idx_creditos_cliente on public.creditos(id_bazar,id_cliente);
create index idx_cuotas_vencimiento on public.cuotas(id_bazar,vencimiento);
create index idx_caja_fecha on public.movimientos_caja(id_bazar,fecha);
create index idx_detalle_ventas_producto on public.detalle_ventas(id_bazar,id_producto);
create index idx_detalle_compras_producto on public.detalle_compras(id_bazar,id_producto);
create index idx_inventario_producto_fecha on public.movimientos_inventario(id_bazar,id_producto,fecha);
create index idx_aplicacion_cuota on public.aplicaciones_pago(id_bazar,id_cuota);

create view public.cuentas_por_cobrar with (security_invoker=true) as
select q.id_cuota,q.id_bazar,c.id_cliente,c.id_credito,c.moneda,c.modalidad,q.numero,q.vencimiento,
q.capital-q.capital_pagado as capital_pendiente,q.interes-q.interes_pagado as interes_pendiente,
q.mora_devengada-q.mora_pagada
+case when q.capital+q.interes>q.capital_pagado+q.interes_pagado
 then (q.capital+q.interes-q.capital_pagado-q.interes_pagado)*c.tasa_mora_diaria*
 greatest(0,(now() at time zone 'America/Lima')::date-q.mora_hasta) else 0 end as mora_pendiente,
q.capital+q.interes-q.capital_pagado-q.interes_pagado+q.mora_devengada-q.mora_pagada
+case when q.capital+q.interes>q.capital_pagado+q.interes_pagado
 then (q.capital+q.interes-q.capital_pagado-q.interes_pagado)*c.tasa_mora_diaria*
 greatest(0,(now() at time zone 'America/Lima')::date-q.mora_hasta) else 0 end as saldo
from public.cuotas q join public.creditos c on c.id_credito=q.id_credito;
create view public.cuentas_corrientes with (security_invoker=true) as
select c.id_bazar,c.id_cliente,f.moneda,f.linea_credito_max,
coalesce(sum(x.capital_pendiente),0) credito_utilizado,
greatest(0,f.linea_credito_max-coalesce(sum(x.capital_pendiente),0)) saldo_disponible,
coalesce(sum(x.saldo),0) deuda_total,
coalesce(bool_or(x.saldo>0 and x.vencimiento<(now() at time zone 'America/Lima')::date),false) en_mora
from public.clientes c join public.configuraciones_credito f on f.id_cliente=c.id_cliente
left join public.cuentas_por_cobrar x on x.id_cliente=c.id_cliente and x.moneda=f.moneda
group by c.id_bazar,c.id_cliente,f.moneda,f.linea_credito_max;
create view public.cuentas_por_pagar with (security_invoker=true) as
select c.id_compra,c.id_bazar,c.proveedor,c.fecha,c.vencimiento,c.moneda,c.total,
coalesce(sum(m.monto),0) pagado,c.total-coalesce(sum(m.monto),0) saldo
from public.compras c left join public.movimientos_caja m on m.id_compra=c.id_compra and m.tipo='EGRESO'
group by c.id_compra;
grant select on public.cuentas_por_cobrar,public.cuentas_corrientes,public.cuentas_por_pagar to authenticated;
revoke all on public.cuentas_por_cobrar,public.cuentas_corrientes,public.cuentas_por_pagar from anon;



-- Additive Bazi state. Existing commercial tables and policies are not changed.
create function mibazar_privado.bazi_acceso(b uuid,c uuid,r text) returns boolean
language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.perfiles p where p.id=auth.uid() and p.estado='ACTIVO' and p.rol=r)
 and case when r='CLIENTE' then c is not null and mibazar_privado.es_cliente(b,c)
 when r in ('DUENO_BAZAR','SUPERADMIN') then c is null and mibazar_privado.puede_gestionar(b) else false end
$$;
revoke all on function mibazar_privado.bazi_acceso(uuid,uuid,text) from public,anon;
grant execute on function mibazar_privado.bazi_acceso(uuid,uuid,text) to authenticated;

create table public.bazi_espacios(
 id_usuario uuid not null references public.perfiles(id), id_bazar uuid not null references public.bazares(id_bazar),
 rol text not null check(rol in ('CLIENTE','DUENO_BAZAR','SUPERADMIN')), id_cliente uuid references public.clientes(id_cliente),
 contenido jsonb not null default '{}'::jsonb check(jsonb_typeof(contenido)='object' and octet_length(contenido::text)<=524288),
 version integer not null default 1 check(version>0), updated_at timestamptz not null default now(),
 primary key(id_usuario,id_bazar,rol)
);
alter table public.bazi_espacios enable row level security;
create policy bazi_espacio_propio on public.bazi_espacios to authenticated
 using(id_usuario=(select auth.uid()) and mibazar_privado.bazi_acceso(id_bazar,id_cliente,rol))
 with check(id_usuario=(select auth.uid()) and mibazar_privado.bazi_acceso(id_bazar,id_cliente,rol));
revoke all on public.bazi_espacios from public,anon,authenticated;
grant select,insert,update on public.bazi_espacios to authenticated;
create index bazi_espacio_bazar_idx on public.bazi_espacios(id_bazar);
create index bazi_espacio_cliente_idx on public.bazi_espacios(id_cliente);

create function public.bazi_guardar_espacio(p_bazar uuid,p_cliente uuid,p_rol text,p_version integer,p_contenido jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare v integer;
begin
 if not mibazar_privado.bazi_acceso(p_bazar,p_cliente,p_rol) then raise exception 'Acceso no disponible' using errcode='42501'; end if;
 if p_version=0 then
  insert into public.bazi_espacios(id_usuario,id_bazar,id_cliente,rol,contenido) values(auth.uid(),p_bazar,p_cliente,p_rol,p_contenido)
  on conflict do nothing returning version into v;
 else
  update public.bazi_espacios set contenido=p_contenido,version=version+1,updated_at=now()
  where id_usuario=auth.uid() and id_bazar=p_bazar and rol=p_rol and version=p_version and id_cliente is not distinct from p_cliente returning version into v;
 end if;
 return jsonb_build_object('saved',v is not null,'version',v);
end $$;
revoke all on function public.bazi_guardar_espacio(uuid,uuid,text,integer,jsonb) from public,anon;
grant execute on function public.bazi_guardar_espacio(uuid,uuid,text,integer,jsonb) to authenticated;

create table public.bazi_memoria(
 id uuid primary key default gen_random_uuid(),id_bazar uuid not null references public.bazares(id_bazar),
 id_autor uuid not null default auth.uid() references public.perfiles(id),
 titulo text not null check(length(titulo) between 3 and 100),contenido text not null check(length(contenido) between 5 and 1800),
 activo boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.bazi_memoria enable row level security;
create policy bazi_memoria_lectura on public.bazi_memoria for select to authenticated using(mibazar_privado.puede_gestionar(id_bazar));
create policy bazi_memoria_crear on public.bazi_memoria for insert to authenticated with check(id_autor=(select auth.uid()) and mibazar_privado.puede_gestionar(id_bazar));
create policy bazi_memoria_cambiar on public.bazi_memoria for update to authenticated using(mibazar_privado.puede_gestionar(id_bazar)) with check(mibazar_privado.puede_gestionar(id_bazar));
revoke all on public.bazi_memoria from public,anon,authenticated;
grant select,insert,update on public.bazi_memoria to authenticated;
create index bazi_memoria_bazar_idx on public.bazi_memoria(id_bazar,activo);
create index bazi_memoria_autor_idx on public.bazi_memoria(id_autor);

create function mibazar_privado.bazi_siguiente(h time,f text,d integer,t timestamptz) returns timestamptz
language plpgsql stable security invoker set search_path='' as $$
declare local_t timestamp:=t at time zone 'America/Lima'; candidate timestamp;
begin
 candidate:=local_t::date+h;
 if f='SEMANAL' then candidate:=candidate+(((d-extract(dow from candidate)::integer+7)%7)*interval '1 day');end if;
 if candidate<=local_t then candidate:=candidate+case when f='SEMANAL' then interval '7 days' else interval '1 day' end;end if;
 return candidate at time zone 'America/Lima';
end $$;
revoke all on function mibazar_privado.bazi_siguiente(time,text,integer,timestamptz) from public,anon;
grant execute on function mibazar_privado.bazi_siguiente(time,text,integer,timestamptz) to authenticated;

create table public.bazi_rutinas(
 id uuid primary key default gen_random_uuid(),id_usuario uuid not null default auth.uid() references public.perfiles(id),
 id_bazar uuid not null references public.bazares(id_bazar),id_cliente uuid references public.clientes(id_cliente),
 rol text not null check(rol in ('CLIENTE','DUENO_BAZAR','SUPERADMIN')),
 titulo text not null check(length(titulo) between 3 and 100),tipo text not null check(tipo in ('STOCK','VENCIMIENTOS','MI_CUENTA')),
 frecuencia text not null check(frecuencia in ('DIARIA','SEMANAL')),dia integer not null default 1 check(dia between 0 and 6),
 hora time not null,activa boolean not null default true,archivada boolean not null default false,proxima timestamptz not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((rol='CLIENTE' and tipo='MI_CUENTA' and id_cliente is not null) or (rol<>'CLIENTE' and tipo in ('STOCK','VENCIMIENTOS') and id_cliente is null))
);
alter table public.bazi_rutinas enable row level security;
create policy bazi_rutina_propia on public.bazi_rutinas to authenticated
 using(id_usuario=(select auth.uid()) and mibazar_privado.bazi_acceso(id_bazar,id_cliente,rol))
 with check(id_usuario=(select auth.uid()) and mibazar_privado.bazi_acceso(id_bazar,id_cliente,rol));
revoke all on public.bazi_rutinas from public,anon,authenticated;
grant select,insert,update on public.bazi_rutinas to authenticated;
create index bazi_rutina_propia_idx on public.bazi_rutinas(id_usuario,id_bazar,rol);
create index bazi_rutina_cliente_idx on public.bazi_rutinas(id_cliente);
create index bazi_rutina_pendiente_idx on public.bazi_rutinas(proxima) where activa and not archivada;
create index bazi_rutina_bazar_idx on public.bazi_rutinas(id_bazar);

create function public.bazi_programar(p_id uuid,p_bazar uuid,p_cliente uuid,p_rol text,p_titulo text,p_tipo text,p_frecuencia text,p_dia integer,p_hora time) returns uuid
language plpgsql security invoker set search_path='' as $$
declare result_id uuid;
begin
 if not mibazar_privado.bazi_acceso(p_bazar,p_cliente,p_rol) then raise exception 'Acceso no disponible' using errcode='42501';end if;
 if p_id is null then
  if (select count(*) from public.bazi_rutinas where id_usuario=auth.uid() and id_bazar=p_bazar and rol=p_rol and not archivada)>=20 then raise exception 'Puedes mantener hasta veinte rutinas por espacio.';end if;
  insert into public.bazi_rutinas(id_bazar,id_cliente,rol,titulo,tipo,frecuencia,dia,hora,proxima) values(p_bazar,p_cliente,p_rol,p_titulo,p_tipo,p_frecuencia,p_dia,p_hora,mibazar_privado.bazi_siguiente(p_hora,p_frecuencia,p_dia,now())) returning id into result_id;
 else
  update public.bazi_rutinas set titulo=p_titulo,tipo=p_tipo,frecuencia=p_frecuencia,dia=p_dia,hora=p_hora,activa=true,archivada=false,proxima=mibazar_privado.bazi_siguiente(p_hora,p_frecuencia,p_dia,now()),updated_at=now()
  where id=p_id and id_usuario=auth.uid() and id_bazar=p_bazar and rol=p_rol and id_cliente is not distinct from p_cliente returning id into result_id;
  if result_id is null then raise exception 'Rutina no disponible' using errcode='42501';end if;
 end if;
 return result_id;
end $$;
revoke all on function public.bazi_programar(uuid,uuid,uuid,text,text,text,text,integer,time) from public,anon;
grant execute on function public.bazi_programar(uuid,uuid,uuid,text,text,text,text,integer,time) to authenticated;

create table public.bazi_ejecuciones(
 id uuid primary key default gen_random_uuid(),id_rutina uuid not null references public.bazi_rutinas(id),
 programada_para timestamptz not null,created_at timestamptz not null default now(),
 estado text not null check(estado in ('LISTO','ERROR','ACCESO_REVOCADO')),resultado jsonb not null,
 unique(id_rutina,programada_para)
);
alter table public.bazi_ejecuciones enable row level security;
create policy bazi_ejecucion_lectura on public.bazi_ejecuciones for select to authenticated using(exists(select 1 from public.bazi_rutinas r where r.id=id_rutina));
create policy bazi_ejecucion_crear on public.bazi_ejecuciones for insert to authenticated with check(exists(select 1 from public.bazi_rutinas r where r.id=id_rutina and not r.archivada));
revoke all on public.bazi_ejecuciones from public,anon,authenticated;
grant select,insert on public.bazi_ejecuciones to authenticated;

-- Invoker privileges preserve RLS for manual runs; the trusted worker additionally validates its owner.
create function mibazar_privado.bazi_resumen(b uuid,c uuid,k text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare metrics jsonb; today date:=(now() at time zone 'America/Lima')::date;
begin
 if k='STOCK' then
  select jsonb_build_array(jsonb_build_object('label','Productos activos','value',count(*)::text),jsonb_build_object('label','Agotados','value',count(*) filter(where stock_actual<=0)::text),jsonb_build_object('label','Stock bajo','value',count(*) filter(where stock_actual>0 and stock_actual<=stock_minimo)::text)) into metrics from public.productos where id_bazar=b and estado='ACTIVO';
 elsif k='VENCIMIENTOS' then
  select coalesce(jsonb_agg(jsonb_build_object('label',tipo||' · '||moneda,'value',importe::text)), '[]'::jsonb) into metrics from (
   select 'Por cobrar (hasta 7 días)' tipo,moneda,sum(saldo) importe from public.cuentas_por_cobrar where id_bazar=b and saldo>0 and vencimiento<=today+7 group by moneda
   union all select 'Por pagar (hasta 7 días)',moneda,sum(saldo) from public.cuentas_por_pagar where id_bazar=b and saldo>0 and vencimiento<=today+7 group by moneda
  ) s;
 elsif k='MI_CUENTA' and c is not null then
  select coalesce(jsonb_agg(jsonb_build_object('label','Mis cuotas · '||moneda,'value',importe::text)), '[]'::jsonb) into metrics from (select moneda,sum(saldo) importe from public.cuentas_por_cobrar where id_bazar=b and id_cliente=c and saldo>0 and vencimiento<=today+7 group by moneda) s;
 else raise exception 'Tipo de resumen no disponible';end if;
 return jsonb_build_object('metrics',metrics,'date',today,'note','Datos al momento de la ejecución. Vencimientos incluye importes vencidos y hasta los próximos siete días; monedas separadas. No registra operaciones ni envía mensajes.');
end $$;
revoke all on function mibazar_privado.bazi_resumen(uuid,uuid,text) from public,anon;
grant execute on function mibazar_privado.bazi_resumen(uuid,uuid,text) to authenticated;

create function public.bazi_ejecutar_rutina(p_id uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare r public.bazi_rutinas%rowtype; result_id uuid;
begin
 select * into r from public.bazi_rutinas where id=p_id and id_usuario=auth.uid() and not archivada for update;
 if not found then raise exception 'Rutina no disponible' using errcode='42501';end if;
 insert into public.bazi_ejecuciones(id_rutina,programada_para,estado,resultado) values(r.id,clock_timestamp(),'LISTO',mibazar_privado.bazi_resumen(r.id_bazar,r.id_cliente,r.tipo)) returning id into result_id;
 return result_id;
end $$;
revoke all on function public.bazi_ejecutar_rutina(uuid) from public,anon;
grant execute on function public.bazi_ejecutar_rutina(uuid) to authenticated;

-- Only the database scheduler owner can invoke this function. No HTTP access or provider keys.
create function mibazar_privado.bazi_despachar() returns integer language plpgsql security invoker set search_path='' as $$
declare r public.bazi_rutinas%rowtype; allowed boolean; payload jsonb; n integer:=0;
begin
 for r in select * from public.bazi_rutinas where activa and not archivada and proxima<=now() order by proxima limit 25 for update skip locked loop
  allowed:=exists(select 1 from public.perfiles p join public.bazares z on z.id_bazar=r.id_bazar where p.id=r.id_usuario and p.estado='ACTIVO' and p.rol=r.rol and z.estado='ACTIVO' and (
   (r.rol='CLIENTE' and exists(select 1 from public.clientes c where c.id_cliente=r.id_cliente and c.id_bazar=r.id_bazar and c.id_usuario=r.id_usuario and c.estado_registro='ACTIVO')) or
   (r.rol='SUPERADMIN') or (r.rol='DUENO_BAZAR' and exists(select 1 from public.usuarios_bazar u where u.id_bazar=r.id_bazar and u.id_usuario=r.id_usuario and u.estado='ACTIVO' and u.rol_bazar='PROPIETARIO'))));
  if not allowed then
   update public.bazi_rutinas set activa=false,updated_at=now() where id=r.id;
   insert into public.bazi_ejecuciones(id_rutina,programada_para,estado,resultado) values(r.id,r.proxima,'ACCESO_REVOCADO','{"note":"La rutina se pausó porque su creador ya no tiene acceso."}') on conflict do nothing;
  else
   begin
    payload:=mibazar_privado.bazi_resumen(r.id_bazar,r.id_cliente,r.tipo);
    insert into public.bazi_ejecuciones(id_rutina,programada_para,estado,resultado) values(r.id,r.proxima,'LISTO',payload) on conflict do nothing;
   exception when others then
    insert into public.bazi_ejecuciones(id_rutina,programada_para,estado,resultado) values(r.id,r.proxima,'ERROR','{"note":"No se pudo preparar el resumen. Puedes volver a ejecutarlo desde Bazi."}') on conflict do nothing;
   end;
   update public.bazi_rutinas set proxima=mibazar_privado.bazi_siguiente(r.hora,r.frecuencia,r.dia,now()),updated_at=now() where id=r.id;
  end if;
  n:=n+1;
 end loop;
 return n;
end $$;
revoke all on function mibazar_privado.bazi_despachar() from public,anon,authenticated,service_role;

create extension if not exists pg_cron;
select cron.schedule('mibazar-bazi-resumenes','* * * * *','select mibazar_privado.bazi_despachar();');
notify pgrst,'reload schema';

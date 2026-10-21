-- Incremental access workflows. No rows are deleted and no existing debt is repriced.
-- Rollback strategy: revoke EXECUTE on the new public entrypoints to disable workflows;
-- retain invitations/audit history. Restore prior policies only after unlinking new access.
begin;

-- The previous regex escaped the dot twice, rejecting ordinary email addresses.
alter table public.clientes drop constraint chk_cliente_correo;
alter table public.clientes add constraint chk_cliente_correo check (correo is null or correo ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$');
alter table public.bazares drop constraint chk_bazar_correo;
alter table public.bazares add constraint chk_bazar_correo check (correo is null or correo ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$');
create unique index clientes_usuario_por_bazar on public.clientes(id_usuario,id_bazar) where id_usuario is not null;
alter table public.clientes drop constraint clientes_id_usuario_key;

create table public.invitaciones_acceso (
 id_invitacion uuid primary key default gen_random_uuid(),
 id_bazar uuid not null references public.bazares(id_bazar),
 id_cliente uuid,
 tipo text not null check(tipo in ('CLIENTE','PROPIETARIO')),
 correo text not null check(correo=lower(trim(correo)) and correo ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
 token_hash text not null unique,
 creado_por uuid not null references public.perfiles(id),
 created_at timestamptz not null default now(),
 vence_en timestamptz not null default now()+interval '7 days',
 aceptado_por uuid references public.perfiles(id),
 aceptado_en timestamptz,
 revocado_en timestamptz,
 foreign key (id_bazar,id_cliente) references public.clientes(id_bazar,id_cliente),
 check((tipo='CLIENTE' and id_cliente is not null) or (tipo='PROPIETARIO' and id_cliente is null)),
 check((aceptado_por is null)=(aceptado_en is null))
);
create index invitaciones_bazar_fecha on public.invitaciones_acceso(id_bazar,created_at desc);
create index invitaciones_cliente on public.invitaciones_acceso(id_bazar,id_cliente);
create index invitaciones_creador on public.invitaciones_acceso(creado_por);
create index invitaciones_aceptante on public.invitaciones_acceso(aceptado_por);
alter table public.invitaciones_acceso enable row level security;
revoke all on public.invitaciones_acceso from anon,authenticated;
grant select(id_invitacion,id_bazar,id_cliente,tipo,correo,creado_por,created_at,vence_en,aceptado_por,aceptado_en,revocado_en) on public.invitaciones_acceso to authenticated;
create policy invitaciones_lectura on public.invitaciones_acceso for select to authenticated using (mibazar_privado.puede_gestionar(id_bazar));

create or replace function mibazar_privado.auditar_maestro() returns trigger language plpgsql security definer set search_path='' as $$
declare b uuid; r uuid; vinculo boolean:=false;
begin
 if auth.uid() is null then return new; end if;
 if tg_table_name='productos' then b:=new.id_bazar; r:=new.id_producto;
 elsif tg_table_name='clientes' then
  b:=new.id_bazar; r:=new.id_cliente;
  if tg_op='UPDATE' then
   vinculo:=old.id_usuario is null and new.id_usuario=auth.uid()
    and (to_jsonb(new)-'id_usuario'-'updated_at')=(to_jsonb(old)-'id_usuario'-'updated_at')
    and exists(select 1 from public.invitaciones_acceso i where i.id_cliente=r and i.id_bazar=b and i.aceptado_por=auth.uid() and i.aceptado_en=now() and i.revocado_en is null);
  end if;
 else select id_bazar into b from public.clientes where id_cliente=new.id_cliente; r:=new.id_configuracion;
 end if;
 if not mibazar_privado.puede_gestionar(b) and not vinculo then raise exception 'ACCESO_DENEGADO' using errcode='42501'; end if;
 perform mibazar_privado.registrar_evento(b,tg_op,tg_table_name,r);
 return new;
end $$;

create or replace function mibazar_privado.es_cliente(b uuid,c uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.clientes x join public.perfiles p on p.id=x.id_usuario join public.bazares z on z.id_bazar=x.id_bazar
 where x.id_cliente=c and x.id_bazar=b and x.id_usuario=auth.uid() and p.estado='ACTIVO' and x.estado_registro='ACTIVO' and z.estado='ACTIVO')
$$;
create function mibazar_privado.es_cliente_bazar(b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.clientes c where c.id_bazar=b and c.id_usuario=auth.uid() and mibazar_privado.es_cliente(b,c.id_cliente))
$$;
revoke all on function mibazar_privado.es_cliente_bazar(uuid) from public,anon;
grant execute on function mibazar_privado.es_cliente_bazar(uuid) to authenticated;
alter policy bazar_guard on public.bazares using (mibazar_privado.puede_gestionar(id_bazar) or mibazar_privado.es_cliente_bazar(id_bazar) or (select mibazar_privado.es_superadmin()));
create policy bazar_cliente on public.bazares for select to authenticated using (mibazar_privado.es_cliente_bazar(id_bazar));
alter policy membresia_guard on public.usuarios_bazar using (exists(select 1 from public.perfiles p where p.id=(select auth.uid()) and p.estado='ACTIVO'));
create policy membresia_admin on public.usuarios_bazar for select to authenticated using ((select mibazar_privado.es_superadmin()));

create function mibazar_privado.guardar_perfil(p_nombre text,p_tipo text,p_documento text,p_telefono text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'SESION_CONFIRMADA_REQUERIDA'; end if;
 if exists(select 1 from public.perfiles where id=u and estado<>'ACTIVO') then raise exception 'ACCESO_DENEGADO'; end if;
 if coalesce(length(trim(p_nombre)),0) not between 3 and 120 or coalesce(p_tipo,'') not in ('DNI','RUC') or coalesce(p_documento,'') !~ (case when p_tipo='DNI' then '^[0-9]{8}$' else '^[0-9]{11}$' end) then raise exception 'DATOS_INVALIDOS'; end if;
 insert into public.perfiles(id,nombre_completo,tipo_documento,numero_documento,telefono,rol)
 values(u,trim(p_nombre),p_tipo,p_documento,nullif(trim(p_telefono),''),'DUENO_BAZAR')
 on conflict(id) do update set nombre_completo=excluded.nombre_completo,telefono=excluded.telefono;
 -- Existing identity documents and roles cannot be overwritten from a public form.
end $$;

create function mibazar_privado.guardar_bazar(p_bazar uuid,p_datos jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); b uuid; anterior jsonb;
begin
 if u is null or not exists(select 1 from public.perfiles where id=u and estado='ACTIVO' and rol in ('DUENO_BAZAR','SUPERADMIN')) then raise exception 'ACCESO_DENEGADO'; end if;
 if p_datos is null or coalesce(length(trim(p_datos->>'nombre')),0) not between 2 and 120 or coalesce(length(trim(p_datos->>'razon_social')),0) not between 2 and 160 or coalesce(length(trim(p_datos->>'direccion')),0) not between 3 and 240 then raise exception 'DATOS_INVALIDOS'; end if;
 if p_bazar is null then
  insert into public.bazares(ruc,razon_social,nombre_comercial,direccion,telefono,correo,distrito,provincia,departamento)
  values(p_datos->>'ruc',trim(p_datos->>'razon_social'),trim(p_datos->>'nombre'),trim(p_datos->>'direccion'),nullif(p_datos->>'telefono',''),nullif(lower(trim(p_datos->>'correo')),''),nullif(p_datos->>'distrito',''),nullif(p_datos->>'provincia',''),nullif(p_datos->>'departamento','')) returning id_bazar into b;
  insert into public.usuarios_bazar(id_usuario,id_bazar,rol_bazar) values(u,b,'PROPIETARIO');
 else
  if not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO'; end if;
  select jsonb_build_object('nombre',nombre_comercial,'permite_pagos_parciales',permite_pagos_parciales) into anterior from public.bazares where id_bazar=p_bazar for update;
  update public.bazares set nombre_comercial=trim(p_datos->>'nombre'),razon_social=trim(p_datos->>'razon_social'),direccion=trim(p_datos->>'direccion'),telefono=nullif(p_datos->>'telefono',''),correo=nullif(lower(trim(p_datos->>'correo')),''),distrito=nullif(p_datos->>'distrito',''),provincia=nullif(p_datos->>'provincia',''),departamento=nullif(p_datos->>'departamento',''),permite_pagos_parciales=coalesce((p_datos->>'pagos_parciales')::boolean,false) where id_bazar=p_bazar;
  b:=p_bazar;
 end if;
 insert into public.auditoria(id_bazar,id_usuario,accion,entidad,id_registro,datos) values(b,u,case when p_bazar is null then 'BAZAR_CREADO' else 'BAZAR_ACTUALIZADO' end,'bazares',b,jsonb_build_object('anterior',anterior));
 return b;
end $$;

create function mibazar_privado.crear_invitacion(p_bazar uuid,p_cliente uuid,p_correo text,p_tipo text) returns text language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); token text:=gen_random_uuid()::text||gen_random_uuid()::text; c public.clientes%rowtype; v_correo text:=lower(trim(p_correo)); iid uuid;
begin
 if u is null or not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO'; end if;
 if coalesce(length(v_correo),0) not between 3 and 254 then raise exception 'DATOS_INVALIDOS'; end if;
 if p_tipo='PROPIETARIO' then
  if not mibazar_privado.es_superadmin() or p_cliente is not null then raise exception 'ACCESO_DENEGADO'; end if;
 elsif p_tipo='CLIENTE' then
  select * into c from public.clientes where id_cliente=p_cliente and id_bazar=p_bazar and estado_registro='ACTIVO' for update;
  if not found or c.id_usuario is not null or c.consentimiento_fecha is null then raise exception 'CLIENTE_NO_HABILITADO'; end if;
  if c.correo is null or lower(trim(c.correo))<>v_correo then raise exception 'CORREO_NO_COINCIDE'; end if;
 else raise exception 'DATOS_INVALIDOS'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_bazar::text,0));
 if exists(select 1 from public.invitaciones_acceso where id_bazar=p_bazar and creado_por=u and created_at>now()-interval '30 seconds') then raise exception 'ESPERA_30_SEGUNDOS'; end if;
 update public.invitaciones_acceso set revocado_en=now() where id_bazar=p_bazar and tipo=p_tipo and correo=v_correo and aceptado_en is null and revocado_en is null;
 insert into public.invitaciones_acceso(id_bazar,id_cliente,tipo,correo,token_hash,creado_por) values(p_bazar,p_cliente,p_tipo,v_correo,encode(sha256(convert_to(token,'UTF8')),'hex'),u) returning id_invitacion into iid;
 insert into public.auditoria(id_bazar,id_usuario,accion,entidad,id_registro) values(p_bazar,u,'INVITACION_CREADA','invitaciones_acceso',iid);
 return token;
end $$;

create function mibazar_privado.aceptar_invitacion(p_token text) returns text language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); correo_usuario text; i public.invitaciones_acceso%rowtype; c public.clientes%rowtype; p public.perfiles%rowtype;
begin
 select lower(email) into correo_usuario from auth.users where id=u and email_confirmed_at is not null;
 if u is null or correo_usuario is null then raise exception 'SESION_CONFIRMADA_REQUERIDA'; end if;
 select * into i from public.invitaciones_acceso where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
 if not found or i.correo<>correo_usuario or i.revocado_en is not null or i.aceptado_en is not null or i.vence_en<=now() then raise exception 'INVITACION_INVALIDA'; end if;
 if not exists(select 1 from public.bazares where id_bazar=i.id_bazar and estado='ACTIVO') then raise exception 'ACCESO_DENEGADO'; end if;
 -- Serialize profile creation across invitations for the same authenticated account.
 perform pg_advisory_xact_lock(hashtextextended(u::text,1));
 select * into p from public.perfiles where id=u for update;
 if found and p.estado<>'ACTIVO' then raise exception 'ACCESO_DENEGADO'; end if;
 if i.tipo='CLIENTE' then
  select * into c from public.clientes where id_cliente=i.id_cliente and id_bazar=i.id_bazar and estado_registro='ACTIVO' for update;
  if not found or (c.id_usuario is not null and c.id_usuario<>u) or lower(c.correo) is distinct from correo_usuario then raise exception 'CLIENTE_NO_HABILITADO'; end if;
  if p.id is not null and (p.tipo_documento<>c.tipo_documento or p.numero_documento<>c.numero_documento) then raise exception 'DOCUMENTO_NO_COINCIDE'; end if;
  insert into public.perfiles(id,nombre_completo,tipo_documento,numero_documento,telefono,rol) values(u,c.nombre_completo,c.tipo_documento,c.numero_documento,c.telefono,'CLIENTE') on conflict(id) do nothing;
  update public.invitaciones_acceso set aceptado_en=now(),aceptado_por=u where id_invitacion=i.id_invitacion;
  update public.clientes set id_usuario=u where id_cliente=c.id_cliente;
 else
  if p.id is null then raise exception 'COMPLETA_PERFIL'; end if;
  if p.rol='CLIENTE' then update public.perfiles set rol='DUENO_BAZAR' where id=u; end if;
  insert into public.usuarios_bazar(id_usuario,id_bazar,rol_bazar) values(u,i.id_bazar,'PROPIETARIO') on conflict(id_usuario,id_bazar) do update set estado='ACTIVO',rol_bazar='PROPIETARIO';
 end if;
 update public.invitaciones_acceso set aceptado_en=now(),aceptado_por=u where id_invitacion=i.id_invitacion;
 insert into public.auditoria(id_bazar,id_usuario,accion,entidad,id_registro) values(i.id_bazar,u,'INVITACION_ACEPTADA','invitaciones_acceso',i.id_invitacion);
 return i.tipo;
end $$;

create function mibazar_privado.revocar_invitacion(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare i public.invitaciones_acceso%rowtype;
begin
 select * into i from public.invitaciones_acceso where id_invitacion=p_id for update;
 if auth.uid() is null or not found or not mibazar_privado.puede_gestionar(i.id_bazar) or (i.tipo='PROPIETARIO' and not mibazar_privado.es_superadmin()) then raise exception 'ACCESO_DENEGADO'; end if;
 update public.invitaciones_acceso set revocado_en=now() where id_invitacion=p_id and aceptado_en is null;
 insert into public.auditoria(id_bazar,id_usuario,accion,entidad,id_registro) values(i.id_bazar,auth.uid(),'INVITACION_REVOCADA','invitaciones_acceso',p_id);
end $$;

create function public.guardar_perfil(p_nombre text,p_tipo text,p_documento text,p_telefono text) returns void language sql security invoker set search_path='' as $$ select mibazar_privado.guardar_perfil(p_nombre,p_tipo,p_documento,p_telefono) $$;
create function public.guardar_bazar(p_bazar uuid,p_datos jsonb) returns uuid language sql security invoker set search_path='' as $$ select mibazar_privado.guardar_bazar(p_bazar,p_datos) $$;
create function public.crear_invitacion(p_bazar uuid,p_cliente uuid,p_correo text,p_tipo text) returns text language sql security invoker set search_path='' as $$ select mibazar_privado.crear_invitacion(p_bazar,p_cliente,p_correo,p_tipo) $$;
create function public.aceptar_invitacion(p_token text) returns text language sql security invoker set search_path='' as $$ select mibazar_privado.aceptar_invitacion(p_token) $$;
create function public.revocar_invitacion(p_id uuid) returns void language sql security invoker set search_path='' as $$ select mibazar_privado.revocar_invitacion(p_id) $$;
do $$ declare s text; sig text; begin
 foreach s in array array['public','mibazar_privado'] loop
  foreach sig in array array['guardar_perfil(text,text,text,text)','guardar_bazar(uuid,jsonb)','crear_invitacion(uuid,uuid,text,text)','aceptar_invitacion(text)','revocar_invitacion(uuid)'] loop
   execute format('revoke all on function %I.%s from public,anon',s,sig);
   execute format('grant execute on function %I.%s to authenticated',s,sig);
  end loop;
 end loop;
end $$;
commit;

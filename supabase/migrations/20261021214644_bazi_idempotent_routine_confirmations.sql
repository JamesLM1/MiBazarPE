-- Stable proposal IDs make retries idempotent; the authenticated owner is checked again.
create function public.bazi_confirmar_rutina(p_key uuid,p_bazar uuid,p_cliente uuid,p_rol text,p_titulo text,p_tipo text,p_frecuencia text,p_dia integer,p_hora time) returns uuid
language plpgsql security invoker set search_path='' as $$
declare result_id uuid;
begin
 if not mibazar_privado.bazi_acceso(p_bazar,p_cliente,p_rol) then raise exception 'Acceso no disponible' using errcode='42501';end if;
 select id into result_id from public.bazi_rutinas where id=p_key and id_usuario=auth.uid() and id_bazar=p_bazar and rol=p_rol;
 if result_id is not null then return result_id;end if;
 if (select count(*) from public.bazi_rutinas where id_usuario=auth.uid() and id_bazar=p_bazar and rol=p_rol and not archivada)>=20 then raise exception 'Puedes mantener hasta veinte rutinas por espacio.';end if;
 insert into public.bazi_rutinas(id,id_bazar,id_cliente,rol,titulo,tipo,frecuencia,dia,hora,proxima) values(p_key,p_bazar,p_cliente,p_rol,p_titulo,p_tipo,p_frecuencia,p_dia,p_hora,mibazar_privado.bazi_siguiente(p_hora,p_frecuencia,p_dia,now())) on conflict do nothing;
 select id into result_id from public.bazi_rutinas where id=p_key and id_usuario=auth.uid() and id_bazar=p_bazar and rol=p_rol;
 if result_id is null then raise exception 'Rutina no disponible' using errcode='42501';end if;
 return result_id;
end $$;
revoke all on function public.bazi_confirmar_rutina(uuid,uuid,uuid,text,text,text,text,integer,time) from public,anon;
grant execute on function public.bazi_confirmar_rutina(uuid,uuid,uuid,text,text,text,text,integer,time) to authenticated;
notify pgrst,'reload schema';

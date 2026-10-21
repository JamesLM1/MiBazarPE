begin;
create temporary table bazi_test_context as
select (select id from public.perfiles where rol='SUPERADMIN' and estado='ACTIVO' limit 1) admin_id,
       (select id from public.perfiles where rol='DUENO_BAZAR' and estado='ACTIVO' limit 1) owner_id,
       c.id_usuario client_user,c.id_cliente client_id,c.id_bazar client_business,
       (select id_bazar from public.bazares where id_lote_demo is not null and estado='ACTIVO' limit 1) demo_business,
       gen_random_uuid() admin_routine,gen_random_uuid() client_routine
from public.clientes c join public.perfiles p on p.id=c.id_usuario where p.rol='CLIENTE' and p.estado='ACTIVO' and c.estado_registro='ACTIVO' limit 1;
grant select on bazi_test_context to authenticated;
select set_config('request.jwt.claims',(select json_build_object('sub',admin_id,'role','authenticated')::text from bazi_test_context),true);
set local role authenticated;
do $$ declare x record; a uuid; b uuid; begin
 select * into x from bazi_test_context;
 if not mibazar_privado.bazi_acceso(x.demo_business,null,'SUPERADMIN') then raise exception 'Admin rejected';end if;
 a:=public.bazi_confirmar_rutina(x.admin_routine,x.demo_business,null,'SUPERADMIN','Prueba transaccional Bazi','STOCK','DIARIA',1,'09:00');
 b:=public.bazi_confirmar_rutina(x.admin_routine,x.demo_business,null,'SUPERADMIN','Prueba transaccional Bazi','STOCK','DIARIA',1,'09:00');
 if a<>b or (select count(*) from public.bazi_rutinas where id=x.admin_routine)<>1 then raise exception 'Idempotency failed';end if;
 perform public.bazi_ejecutar_rutina(a);
 if not exists(select 1 from public.bazi_ejecuciones where id_rutina=a and estado='LISTO') then raise exception 'Manual run failed';end if;
end $$;
reset role;
select set_config('request.jwt.claims',(select json_build_object('sub',client_user,'role','authenticated')::text from bazi_test_context),true);
set local role authenticated;
do $$ declare x record; rejected boolean:=false; saved jsonb; begin
 select * into x from bazi_test_context;
 if exists(select 1 from public.bazi_rutinas where id=x.admin_routine) then raise exception 'Cross-user routine visible';end if;
 if not mibazar_privado.bazi_acceso(x.client_business,x.client_id,'CLIENTE') then raise exception 'Client account rejected';end if;
 if mibazar_privado.bazi_acceso(x.demo_business,null,'SUPERADMIN') then raise exception 'Client role escalation';end if;
 perform public.bazi_confirmar_rutina(x.client_routine,x.client_business,x.client_id,'CLIENTE','Mis cuotas de prueba','MI_CUENTA','SEMANAL',1,'10:00');
 begin perform public.bazi_confirmar_rutina(gen_random_uuid(),x.client_business,x.client_id,'CLIENTE','No permitido','STOCK','DIARIA',1,'09:00');exception when check_violation then rejected:=true;end;
 if not rejected then raise exception 'Client commercial routine allowed';end if;
 rejected:=false;
 begin insert into public.bazi_memoria(id_bazar,titulo,contenido) values(x.client_business,'No permitido','Cliente no debe escribir memoria comercial');exception when insufficient_privilege then rejected:=true;end;
 if not rejected then raise exception 'Client knowledge write allowed';end if;
 saved:=public.bazi_guardar_espacio(x.client_business,x.client_id,'CLIENTE',0,'{"schema":1,"external":false}');
 -- If the account already had a workspace, CAS should report a conflict, never overwrite it.
 if saved->>'saved'='true' and (public.bazi_guardar_espacio(x.client_business,x.client_id,'CLIENTE',0,'{}')->>'saved')<>'false' then raise exception 'CAS overwrite';end if;
end $$;
reset role;
select set_config('request.jwt.claims',(select json_build_object('sub',owner_id,'role','authenticated')::text from bazi_test_context),true);
set local role authenticated;
do $$ declare x record; begin
 select * into x from bazi_test_context;
 if exists(select 1 from public.bazi_rutinas where id in (x.admin_routine,x.client_routine)) then raise exception 'Owner sees other users routines';end if;
 if mibazar_privado.bazi_acceso(x.demo_business,null,'SUPERADMIN') then raise exception 'Owner role escalation';end if;
end $$;
reset role;
do $$ declare x record; begin
 select * into x from bazi_test_context;
 update public.bazi_rutinas set proxima=now()-interval '1 minute' where id=x.admin_routine;
 perform mibazar_privado.bazi_despachar();
 if (select count(*) from public.bazi_ejecuciones where id_rutina=x.admin_routine)<>2 then raise exception 'Scheduled run failed';end if;
 if (select proxima from public.bazi_rutinas where id=x.admin_routine)<=now() then raise exception 'Next run not advanced';end if;
 perform mibazar_privado.bazi_despachar();
 if (select count(*) from public.bazi_ejecuciones where id_rutina=x.admin_routine)<>2 then raise exception 'Duplicate scheduled run';end if;
 if has_function_privilege('authenticated','mibazar_privado.bazi_despachar()','EXECUTE') or has_function_privilege('anon','mibazar_privado.bazi_despachar()','EXECUTE') then raise exception 'Worker exposed';end if;
 if has_table_privilege('anon','public.bazi_espacios','SELECT') or has_table_privilege('anon','public.bazi_rutinas','SELECT') then raise exception 'Anonymous Bazi access';end if;
 if mibazar_privado.bazi_siguiente('09:00','DIARIA',1,'2026-10-21T13:59:00Z')<>'2026-10-21T14:00:00Z'::timestamptz then raise exception 'Lima schedule before time';end if;
 if mibazar_privado.bazi_siguiente('09:00','DIARIA',1,'2026-10-21T14:00:00Z')<>'2026-10-22T14:00:00Z'::timestamptz then raise exception 'Lima schedule after time';end if;
end $$;
select 'PASS: role isolation, client limits, CAS, idempotency, manual and scheduled runs, private worker, Lima time. Test writes will be rolled back.' as bazi_validation;
rollback;

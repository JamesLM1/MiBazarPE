begin;
create function mibazar_privado.buscar_opciones(p_bazar uuid,p_tipo text,p_busqueda text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare resultado jsonb; buscar text:=lower(trim(coalesce(p_busqueda,'')));
begin
 if auth.uid() is null or length(buscar)>80 then raise exception 'ACCESO_DENEGADO'; end if;
 if p_tipo='bazares' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into resultado from (
   select b.id_bazar id,b.nombre_comercial label from public.bazares b where b.estado='ACTIVO' and mibazar_privado.puede_gestionar(b.id_bazar)
   and (position(buscar in lower(b.nombre_comercial))>0 or b.ruc=buscar) order by b.nombre_comercial,b.id_bazar limit 30)s;
  return resultado;
 end if;
 if not mibazar_privado.puede_gestionar(p_bazar) then raise exception 'ACCESO_DENEGADO'; end if;
 case p_tipo
 when 'clientes','sin_linea' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into resultado from (
   select c.id_cliente id,c.nombre_completo label from public.clientes c where c.id_bazar=p_bazar and c.estado_registro='ACTIVO'
   and (position(buscar in lower(c.nombre_completo))>0 or c.numero_documento=buscar)
   and (p_tipo<>'sin_linea' or not exists(select 1 from public.configuraciones_credito f where f.id_cliente=c.id_cliente))
   order by c.nombre_completo,c.id_cliente limit 30)s;
 when 'productos','productos_compra' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into resultado from (
   select p.id_producto id,p.nombre||' · stock '||p.stock_actual||' · S/ '||p.precio_contado label from public.productos p where p.id_bazar=p_bazar and p.estado='ACTIVO'
   and (p_tipo='productos_compra' or p.stock_actual>0) and (position(buscar in lower(p.nombre))>0 or position(buscar in lower(p.codigo_sku))>0)
   order by p.nombre,p.id_producto limit 30)s;
 when 'cuotas' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into resultado from (
   select q.id_cuota id,c.nombre_completo||' · cuota '||q.numero||' · '||q.vencimiento||' · '||q.moneda||' '||round(q.saldo,2) label from public.cuentas_por_cobrar q join public.clientes c using(id_cliente,id_bazar)
   where q.id_bazar=p_bazar and q.saldo>0 and (position(buscar in lower(c.nombre_completo))>0 or c.numero_documento=buscar)
   order by q.vencimiento,q.id_cuota limit 30)s;
 when 'proveedores' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into resultado from (
   select q.id_compra id,q.proveedor||' · '||q.vencimiento||' · '||q.moneda||' '||round(q.saldo,2) label from public.cuentas_por_pagar q
   where q.id_bazar=p_bazar and q.saldo>0 and position(buscar in lower(q.proveedor))>0 order by q.vencimiento,q.id_compra limit 30)s;
 else raise exception 'TIPO_INVALIDO';
 end case;
 return resultado;
end $$;
create function public.buscar_opciones(p_bazar uuid,p_tipo text,p_busqueda text) returns jsonb language sql security invoker set search_path='' as $$ select mibazar_privado.buscar_opciones(p_bazar,p_tipo,p_busqueda) $$;
revoke all on function public.buscar_opciones(uuid,text,text),mibazar_privado.buscar_opciones(uuid,text,text) from public,anon;
grant execute on function public.buscar_opciones(uuid,text,text),mibazar_privado.buscar_opciones(uuid,text,text) to authenticated;
commit;

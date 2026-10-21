begin;

-- Additive import ledger. Existing catalogue entries are never overwritten.
create table public.importaciones_catalogo (
 id_importacion uuid primary key default gen_random_uuid(),
 id_bazar uuid not null references public.bazares(id_bazar),
 id_usuario uuid not null references auth.users(id),
 clave uuid not null,
 tipo text not null check (tipo in ('productos','clientes')),
 nombre_archivo varchar(180) not null check (length(nombre_archivo) between 1 and 180),
 huella text not null check (huella ~ '^[0-9a-f]{64}$'),
 filas integer not null check (filas between 1 and 500),
 creados integer not null check (creados between 0 and 500),
 omitidos integer not null check (omitidos between 0 and 500),
 duplicadas integer[] not null default '{}',
 ids_creados uuid[] not null default '{}',
 created_at timestamptz not null default now(),
 constraint importaciones_catalogo_totales check (creados + omitidos = filas and cardinality(ids_creados)=creados and cardinality(duplicadas)=omitidos),
 constraint importaciones_catalogo_clave unique (id_bazar,clave),
 constraint importaciones_catalogo_contenido unique (id_bazar,tipo,huella)
);
create index importaciones_catalogo_bazar_fecha_idx on public.importaciones_catalogo(id_bazar,created_at desc);
create index importaciones_catalogo_usuario_idx on public.importaciones_catalogo(id_usuario);
alter table public.importaciones_catalogo enable row level security;
revoke all on public.importaciones_catalogo from public,anon,authenticated;
grant select on public.importaciones_catalogo to authenticated;
create policy importaciones_catalogo_lectura on public.importaciones_catalogo for select to authenticated
 using (mibazar_privado.puede_gestionar(id_bazar));

create function mibazar_privado.importar_catalogo(
 p_bazar uuid,p_tipo text,p_filas jsonb,p_clave uuid,p_archivo text,
 p_confirmar boolean default false,p_consentimiento boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid := auth.uid();
 fila jsonb; campo record; posicion integer := 0; cantidad integer; creados integer := 0;
 duplicadas integer[] := '{}'; vistos text[] := '{}'; ids uuid[] := '{}';
 identidad text; v_huella text; nueva uuid; nueva_importacion uuid; ya public.importaciones_catalogo%rowtype;
 campos text[]; requerido text; minimo integer; maximo integer; valor text;
begin
 if u is null or p_bazar is null or not coalesce(mibazar_privado.puede_gestionar(p_bazar),false) then
  raise exception 'ACCESO_DENEGADO' using errcode='42501';
 end if;
 if p_tipo is null or p_tipo not in ('productos','clientes') or p_clave is null or p_confirmar is null or p_consentimiento is null then
  raise exception 'IMPORTACION_PARAMETROS';
 end if;
 if p_archivo is null or length(btrim(p_archivo)) not between 1 and 180 or p_archivo ~ '[[:cntrl:]]' then
  raise exception 'IMPORTACION_ARCHIVO';
 end if;
 if p_filas is null or jsonb_typeof(p_filas)<>'array' or octet_length(p_filas::text)>500000 then
  raise exception 'IMPORTACION_LIMITE';
 end if;
 cantidad := jsonb_array_length(p_filas);
 if cantidad not between 1 and 500 then raise exception 'IMPORTACION_LIMITE'; end if;
 if p_confirmar and p_tipo='clientes' and not p_consentimiento then raise exception 'IMPORTACION_CONSENTIMIENTO'; end if;

 campos := case when p_tipo='productos' then array['codigo_sku','nombre','categoria','unidad_medida','precio_contado','precio_credito','stock_actual','stock_minimo','marca','descripcion','proveedor']
  else array['nombre_completo','tipo_documento','numero_documento','correo','telefono','direccion'] end;
 -- Validate the whole payload before looking up duplicates or inserting any rows.
 for fila in select value from jsonb_array_elements(p_filas) loop
  posicion := posicion+1;
  if jsonb_typeof(fila)<>'object' then raise exception 'IMPORTACION_FILA:%:estructura',posicion; end if;
  for campo in select key,value from jsonb_each(fila) loop
   if not campo.key=any(campos) then raise exception 'IMPORTACION_FILA:%:columna',posicion; end if;
   if campo.key not in ('stock_actual','stock_minimo') and jsonb_typeof(campo.value) not in ('string','null') then
    raise exception 'IMPORTACION_FILA:%:%',posicion,campo.key;
   end if;
   if jsonb_typeof(campo.value)='string' and (campo.value #>> '{}') ~ '[[:cntrl:]]' then
    raise exception 'IMPORTACION_FILA:%:%',posicion,campo.key;
   end if;
  end loop;
  if p_tipo='productos' then
   foreach requerido in array array['codigo_sku','nombre','categoria','unidad_medida'] loop
    minimo := case when requerido in ('codigo_sku','nombre') then 2 else 1 end;
    maximo := case requerido when 'codigo_sku' then 20 when 'nombre' then 100 when 'categoria' then 50 else 20 end;
    if coalesce(length(btrim(fila->>requerido)),0) not between minimo and maximo then
     raise exception 'IMPORTACION_FILA:%:%',posicion,requerido;
    end if;
   end loop;
   if fila->>'unidad_medida' not in ('Unidad','Paquete','Docena','Caja','Set') then raise exception 'IMPORTACION_FILA:%:unidad_medida',posicion; end if;
   foreach requerido in array array['precio_contado','precio_credito'] loop
    valor := fila->>requerido;
    if valor is null or valor !~ '^(0|[1-9][0-9]{0,5})[.][0-9]{2}$' then raise exception 'IMPORTACION_FILA:%:%',posicion,requerido; end if;
    if valor::numeric<=0 or valor::numeric>100000 then raise exception 'IMPORTACION_FILA:%:%',posicion,requerido; end if;
   end loop;
   if (fila->>'precio_credito')::numeric < (fila->>'precio_contado')::numeric then raise exception 'IMPORTACION_FILA:%:precio_credito',posicion; end if;
   foreach requerido in array array['stock_actual','stock_minimo'] loop
    valor := fila->>requerido;
    if jsonb_typeof(fila->requerido) is distinct from 'number' or valor !~ '^(0|[1-9][0-9]{0,5})$' then raise exception 'IMPORTACION_FILA:%:%',posicion,requerido; end if;
    if valor::integer>100000 then raise exception 'IMPORTACION_FILA:%:%',posicion,requerido; end if;
   end loop;
   foreach requerido in array array['marca','descripcion','proveedor'] loop
    maximo := case requerido when 'marca' then 80 when 'descripcion' then 250 else 120 end;
    if coalesce(length(fila->>requerido),0)>maximo then raise exception 'IMPORTACION_FILA:%:%',posicion,requerido; end if;
   end loop;
  else
   if coalesce(length(btrim(fila->>'nombre_completo')),0) not between 3 and 100 then raise exception 'IMPORTACION_FILA:%:nombre_completo',posicion; end if;
   if coalesce(fila->>'tipo_documento','') not in ('DNI','RUC') then raise exception 'IMPORTACION_FILA:%:tipo_documento',posicion; end if;
   if coalesce(fila->>'numero_documento','') !~ (case when fila->>'tipo_documento'='DNI' then '^[0-9]{8}$' else '^[0-9]{11}$' end) then raise exception 'IMPORTACION_FILA:%:numero_documento',posicion; end if;
   valor := nullif(btrim(fila->>'correo'),'');
   if valor is not null and (length(valor)>120 or valor !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then raise exception 'IMPORTACION_FILA:%:correo',posicion; end if;
   valor := nullif(btrim(fila->>'telefono'),'');
   if valor is not null and valor !~ '^9[0-9]{8}$' then raise exception 'IMPORTACION_FILA:%:telefono',posicion; end if;
   if coalesce(length(fila->>'direccion'),0)>250 then raise exception 'IMPORTACION_FILA:%:direccion',posicion; end if;
  end if;
 end loop;

 v_huella := encode(sha256(convert_to(p_filas::text,'UTF8')),'hex');
 -- Serialize imports within this bazar, including retries with a fresh request key.
 if p_confirmar then perform pg_advisory_xact_lock(hashtextextended(p_bazar::text,0)); end if;
 select * into ya from public.importaciones_catalogo i where i.id_bazar=p_bazar and i.clave=p_clave;
 if found and (ya.huella<>v_huella or ya.tipo<>p_tipo) then raise exception 'IMPORTACION_CLAVE_REUTILIZADA'; end if;
 if ya.id_importacion is null then
  select * into ya from public.importaciones_catalogo i where i.id_bazar=p_bazar and i.tipo=p_tipo and i.huella=v_huella;
 end if;
 if ya.id_importacion is not null then
  return jsonb_build_object('por_crear',0,'creados',ya.creados,'omitidos',ya.omitidos,'duplicadas',ya.duplicadas,'importacion_id',ya.id_importacion,'repetida',true);
 end if;

 posicion := 0;
 for fila in select value from jsonb_array_elements(p_filas) loop
  posicion := posicion+1;
  identidad := btrim(fila->>(case when p_tipo='productos' then 'codigo_sku' else 'numero_documento' end));
  if identidad=any(vistos)
    or (p_tipo='productos' and exists(select 1 from public.productos p where p.id_bazar=p_bazar and p.codigo_sku=identidad))
    or (p_tipo='clientes' and exists(select 1 from public.clientes c where c.id_bazar=p_bazar and c.numero_documento=identidad)) then
   duplicadas := array_append(duplicadas,posicion);
   continue;
  end if;
  vistos := array_append(vistos,identidad);
  if not p_confirmar then continue; end if;
  nueva := null;
  if p_tipo='productos' then
   insert into public.productos(id_bazar,codigo_sku,nombre,categoria,unidad_medida,precio_contado,precio_credito,stock_actual,stock_minimo,marca,descripcion,proveedor,permite_fin_mes,permite_cuotas)
    values(p_bazar,identidad,btrim(fila->>'nombre'),btrim(fila->>'categoria'),fila->>'unidad_medida',(fila->>'precio_contado')::numeric,(fila->>'precio_credito')::numeric,
      (fila->>'stock_actual')::integer,(fila->>'stock_minimo')::integer,nullif(btrim(fila->>'marca'),''),nullif(btrim(fila->>'descripcion'),''),nullif(btrim(fila->>'proveedor'),''),true,true)
    on conflict (id_bazar,codigo_sku) do nothing returning id_producto into nueva;
   if nueva is not null and (fila->>'stock_actual')::integer>0 then
    insert into public.movimientos_inventario(id_bazar,id_producto,tipo,cantidad,stock_anterior,stock_resultante,motivo,id_usuario_registro)
     values(p_bazar,nueva,'APERTURA',(fila->>'stock_actual')::integer,0,(fila->>'stock_actual')::integer,'Stock inicial mediante importación de catálogo',u);
   end if;
  else
   insert into public.clientes(id_bazar,nombre_completo,tipo_documento,numero_documento,correo,telefono,direccion,consentimiento_fecha)
    values(p_bazar,btrim(fila->>'nombre_completo'),fila->>'tipo_documento',identidad,lower(nullif(btrim(fila->>'correo'),'')),nullif(btrim(fila->>'telefono'),''),nullif(btrim(fila->>'direccion'),''),now())
    on conflict (id_bazar,numero_documento) do nothing returning id_cliente into nueva;
  end if;
  if nueva is null then duplicadas := array_append(duplicadas,posicion);
  else ids := array_append(ids,nueva); creados := creados+1; end if;
 end loop;
 if not p_confirmar then
  return jsonb_build_object('por_crear',cantidad-cardinality(duplicadas),'creados',0,'omitidos',cardinality(duplicadas),'duplicadas',duplicadas,'repetida',false);
 end if;
 insert into public.importaciones_catalogo(id_bazar,id_usuario,clave,tipo,nombre_archivo,huella,filas,creados,omitidos,duplicadas,ids_creados)
  values(p_bazar,u,p_clave,p_tipo,btrim(p_archivo),v_huella,cantidad,creados,cardinality(duplicadas),duplicadas,ids) returning id_importacion into nueva_importacion;
 insert into public.auditoria(id_bazar,id_usuario,accion,entidad,id_registro,datos)
  values(p_bazar,u,'IMPORTACION_CATALOGO','importaciones_catalogo',nueva_importacion,jsonb_build_object('tipo',p_tipo,'creados',creados,'omitidos',cardinality(duplicadas)));
 return jsonb_build_object('por_crear',0,'creados',creados,'omitidos',cardinality(duplicadas),'duplicadas',duplicadas,'importacion_id',nueva_importacion,'repetida',false);
end $$;

create function public.importar_catalogo(
 p_bazar uuid,p_tipo text,p_filas jsonb,p_clave uuid,p_archivo text,
 p_confirmar boolean default false,p_consentimiento boolean default false
) returns jsonb language sql security invoker set search_path='' as $$
 select mibazar_privado.importar_catalogo(p_bazar,p_tipo,p_filas,p_clave,p_archivo,p_confirmar,p_consentimiento)
$$;
revoke all on function public.importar_catalogo(uuid,text,jsonb,uuid,text,boolean,boolean),mibazar_privado.importar_catalogo(uuid,text,jsonb,uuid,text,boolean,boolean) from public,anon;
grant execute on function public.importar_catalogo(uuid,text,jsonb,uuid,text,boolean,boolean),mibazar_privado.importar_catalogo(uuid,text,jsonb,uuid,text,boolean,boolean) to authenticated;
comment on table public.importaciones_catalogo is 'Historial privado de importaciones confirmadas; sin sobrescritura, con validación y trazabilidad del stock inicial.';
commit;

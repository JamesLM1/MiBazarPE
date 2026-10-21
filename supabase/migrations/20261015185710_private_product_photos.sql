-- Additive: existing imagen_url values and all commercial records are preserved.
alter table public.productos add column imagen_storage_path text;
alter table public.productos add constraint productos_imagen_path_check check (
  imagen_storage_path is null or (
    split_part(imagen_storage_path,'/',1)=id_bazar::text
    and split_part(imagen_storage_path,'/',2)=id_producto::text
    and imagen_storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
  )
);
grant select(imagen_storage_path), update(imagen_storage_path) on public.productos to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('catalogo-privado','catalogo-privado',false,768000,array['image/webp']);

create function mibazar_privado.puede_gestionar_foto(ruta text)
returns boolean language sql stable security invoker set search_path=''
as $$
 select auth.uid() is not null and exists (
   select 1 from public.productos p
   where p.id_bazar::text=split_part(ruta,'/',1)
     and p.id_producto::text=split_part(ruta,'/',2)
     and ruta ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
     and mibazar_privado.puede_gestionar(p.id_bazar)
 );
$$;
revoke all on function mibazar_privado.puede_gestionar_foto(text) from public,anon;
grant execute on function mibazar_privado.puede_gestionar_foto(text) to authenticated;

create policy catalogo_fotos_lectura on storage.objects for select to authenticated
using (bucket_id='catalogo-privado' and mibazar_privado.puede_gestionar_foto(name));
create policy catalogo_fotos_alta on storage.objects for insert to authenticated
with check (bucket_id='catalogo-privado' and mibazar_privado.puede_gestionar_foto(name));
-- Only unreferenced photos can be cleaned up. No overwrites or deletes of the current photo.
create policy catalogo_fotos_limpieza on storage.objects for delete to authenticated
using (bucket_id='catalogo-privado' and mibazar_privado.puede_gestionar_foto(name)
 and not exists(select 1 from public.productos p where p.imagen_storage_path=name));

comment on column public.productos.imagen_storage_path is 'Private Storage path. Existing external imagen_url is retained. Read through authenticated application endpoint.';

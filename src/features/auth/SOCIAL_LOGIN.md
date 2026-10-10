# Google y GitHub — estado y activación

Consulta del proyecto existente: `/auth/v1/settings` devuelve `email: true`,
`google: false`, `github: false`. Ambos proveedores sociales están deshabilitados.
El endpoint público no permite saber si hay credenciales guardadas pero inactivas.

`social.ts` consulta esa configuración pública y usa el cliente Supabase existente.
Los botones permanecen deshabilitados mientras el proveedor no esté disponible.
Al habilitarlo, una recarga detecta el cambio y permite `signInWithOAuth` con
`redirectTo` construido desde el origen actual y `/auth/callback`. El callback
existente intercambia el código PKCE; no se creó otro sistema de sesiones.

## Configuración externa necesaria

1. Google Cloud / Google Auth Platform: configurar branding, audiencia,
   consentimiento y scopes `openid`, `email` y `profile`; crear un cliente OAuth
   de tipo Web. Origen JavaScript de desarrollo: `http://localhost:3000`.
2. GitHub > Settings > Developer settings > OAuth Apps: crear o revisar la OAuth
   App y su Client ID / Client Secret. Homepage local: `http://localhost:3000`.
3. En ambos proveedores, usar como callback autorizado del proveedor:
   `https://juiygtydkwflnwapkqsx.supabase.co/auth/v1/callback`.
4. Supabase > Authentication > Sign In / Providers: introducir las credenciales
   respectivas y habilitar Google y GitHub. Los secretos se guardan en Supabase,
   nunca en componentes React ni variables `NEXT_PUBLIC_`.
5. Supabase > Authentication > URL Configuration: Site URL local
   `http://localhost:3000`; permitir `http://localhost:3000/auth/callback`.
   El dominio de producción aún debe decidirse; no se inventó uno.
6. Recargar Login y completar una prueba real con una cuenta controlada en cada
   proveedor. Provider habilitado no garantiza por sí solo credenciales válidas.

No se necesitan nuevas variables de entorno del frontend. Se reutilizan
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o la variable
legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` ya soportada por el proyecto.

## Validación

Las pruebas `auth-social.test.mjs` verifican bloqueo de proveedores deshabilitados,
callback local de Google/GitHub, fallos de configuración y propagación de errores.
Son pruebas con mocks; no equivalen a un consentimiento OAuth y sesión reales.
No se modificó la configuración de Supabase, no se crearon cuentas ni credenciales.

Fuentes oficiales:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/social-login/auth-github

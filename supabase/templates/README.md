# Plantillas de autenticación de MiBazarPE

Copias de los contenidos guardados y previsualizados en Supabase el 17/10/2026.
Proyecto: juiygtydkwflnwapkqsx (EsjamReposit).

- recuperacion-es.html: asunto «Recupera tu acceso a MiBazarPE»; Reset password.
- confirmacion-es.html: asunto «Confirma tu correo en MiBazarPE»; Confirm sign up.

Estas copias no se despliegan automáticamente. Se aplican desde Authentication > Emails > Templates del proyecto correspondiente. Conservar {{ .ConfirmationURL }}: Supabase genera el enlace de uso único y la redirección configurada. No sustituirlo por un enlace fijo ni guardar tokens reales.

La recuperación de prueba anterior a la traducción llegó a Gmail mediante Brevo. Las versiones españolas se verificaron en la vista previa del panel; no se enviaron correos adicionales ni se cambió la contraseña del usuario.

El entorno sigue usando localhost:3000. Antes de publicar, configurar dominio real, Site URL, redirects y los dominios permitidos por Turnstile. El cambio de contraseña de extremo a extremo y la confirmación con una cuenta nueva siguen pendientes.

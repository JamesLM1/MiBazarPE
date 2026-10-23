import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Footer } from "@/components/marketing/footer";
import { legalLinks, marketingContact } from "@/lib/marketing-config";
import styles from "../legal.module.css";

const documents = {
  terminos: {
    title: "Términos y condiciones",
    intro: "Condiciones de uso del sitio y de las funciones disponibles de MiBazarPE.",
    sections: [
      ["Responsable y contacto", `MiBazarPE es un proyecto peruano en desarrollo, coordinado por ${marketingContact.responsible}, ubicado en San Isidro, Lima, Perú. Puedes comunicarte mediante ${marketingContact.email} y ${marketingContact.phone}, o coordinar una visita por estos canales.`],
      ["Alcance del servicio", "La plataforma ayuda a organizar operaciones de un bazar. Algunas pantallas públicas muestran ejemplos identificados como ilustrativos o de demostración. Las funciones disponibles dependen de la versión, el rol y los permisos de cada cuenta. Los planes mostrados son propuestas; no se contratan ni cobran suscripciones desde esta página."],
      ["Cuenta y uso permitido", "Proporciona información exacta, protege tus credenciales y utiliza únicamente cuentas y negocios a los que estés autorizado a acceder. No compartas tu contraseña, suplantes identidades, envíes spam, intentes acceder a datos ajenos ni utilices los formularios para contenido ilícito. El acceso de cliente se vincula mediante las invitaciones y permisos del negocio."],
      ["Información del negocio", "El usuario o titular del negocio es responsable de la legitimidad y exactitud de los datos que registra, de contar con las autorizaciones necesarias y de revisar ventas, pagos y resultados antes de tomar decisiones. MiBazarPE no es una entidad financiera, no concede préstamos por este sitio y no sustituye asesoría contable, tributaria o financiera."],
      ["Contacto y boletín", "El formulario de contacto se utiliza para responder consultas. El boletín es opcional y requiere una autorización independiente y confirmación por correo. Puedes solicitar la baja en los enlaces de los mensajes o mediante el correo de contacto. La solicitud de información no obliga a contratar ningún servicio."],
      ["Disponibilidad y cambios", "El proyecto evoluciona y puede requerir mantenimiento. No se promete disponibilidad ininterrumpida ni funciones que todavía no estén habilitadas. Ante un cambio sustancial en el tratamiento de datos se actualizará la política aplicable y se solicitará un nuevo consentimiento cuando corresponda. Las obligaciones y derechos reconocidos por la legislación peruana no se excluyen por estas condiciones."],
      ["Propiedad y servicios externos", "La marca, los contenidos propios y el software de MiBazarPE se protegen conforme corresponda. Los componentes de terceros conservan sus licencias. Los enlaces a servicios externos como Google, WhatsApp o redes sociales están sujetos a las condiciones de esos servicios."],
      ["Consultas e incidencias", `Para reportar un problema, solicitar asistencia o plantear una consulta sobre estas condiciones, escribe a ${marketingContact.email}. Incluye una descripción, pero nunca contraseñas, códigos de acceso ni información sensible innecesaria.`],
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    intro: "Cómo se utilizan los datos del sitio público, las cuentas y las operaciones de MiBazarPE.",
    sections: [
      ["Quién es responsable", `${marketingContact.responsible} es el responsable de las consultas y suscripciones de MiBazarPE, ubicado en San Isidro, Lima, Perú. Canal para consultas de privacidad y ejercicio de derechos: ${marketingContact.email}; canal alternativo: ${marketingContact.phone}. Puedes coordinar la atención por estos medios.`],
      ["Datos y finalidades", "Contacto: nombres, apellidos, correo, teléfono opcional, asunto y mensaje, para atender y responder tu consulta. Boletín: correo, consentimiento y su confirmación, para enviar novedades de MiBazarPE. Seguridad: el proveedor CAPTCHA procesa información técnica del navegador y del dispositivo para prevenir abuso. No incluyas datos de salud, contraseñas, números de tarjeta ni otros datos sensibles en el mensaje."],
      ["Tu elección", "Enviar una consulta es voluntario. Los campos marcados como obligatorios permiten tramitarla; el teléfono no es obligatorio. La autorización del contacto no incorpora tu correo al boletín. La suscripción tiene su propia casilla y confirmación por correo. Puedes retirar el consentimiento para comunicaciones futuras sin afectar el tratamiento realizado antes de tu solicitud."],
      ["Servicios que intervienen", "Brevo procesa la entrega de correos y la gestión de suscripciones por cuenta del proyecto. Google/Gmail aloja el buzón de contacto y Google Maps muestra el mapa de ubicación. hCaptcha proporciona la verificación contra abuso. Estos proveedores pueden procesar datos fuera de Perú conforme a sus condiciones y medidas de protección. Al cargar el mapa, Google recibe información técnica como la dirección IP y puede utilizar cookies propias. Al abrir WhatsApp o una red social se aplican sus propias políticas; abrir esos enlaces es opcional. No vendemos los datos de las consultas ni de las suscripciones."],
      ["Conservación", "Las consultas se conservan mientras sea necesario para atenderlas y realizar el seguimiento; se revisan para su eliminación como máximo a los seis meses de cerrado el asunto, salvo una obligación o controversia que requiera conservarlas. El correo del boletín se utiliza hasta la baja. Se puede conservar el mínimo registro de exclusión necesario para no volver a enviarte novedades y la evidencia del consentimiento cuando resulte exigible."],
      ["Derechos y solicitudes", `Puedes solicitar información, acceso, rectificación, cancelación u oposición respecto de tus datos y retirar tu consentimiento escribiendo a ${marketingContact.email} con el asunto «Privacidad». Identifica la solicitud y el correo relacionado; se pedirá solo la verificación de identidad necesaria. También puedes acudir a la Autoridad Nacional de Protección de Datos Personales del Perú por sus canales oficiales.`],
      ["Seguridad", "Las claves de los proveedores se mantienen en el servidor. El formulario tiene validación, verificación CAPTCHA y límites de solicitudes. Ningún sistema ofrece seguridad absoluta. Si adviertes una exposición de datos o un acceso ajeno, informa por el correo de contacto sin reenviar contraseñas ni documentos sensibles innecesarios."],
      ["Cuentas y operaciones privadas", "El registro e inicio de sesión se gestionan mediante Supabase Auth. Se tratan datos de cuenta y perfil, del establecimiento y de los productos, clientes y operaciones que un usuario autorizado registra. Supabase almacena esos registros y Netlify sirve la aplicación y sus funciones de servidor. Su finalidad es prestar las funciones de gestión solicitadas y mantener el acceso según rol y negocio. El titular del negocio debe contar con las autorizaciones necesarias para registrar datos de otras personas; crear una cuenta no autoriza usos adicionales de sus datos. Para consultar, corregir o solicitar la eliminación de datos de tu cuenta o negocio, utiliza el canal de privacidad indicado; la solicitud se revisa según la titularidad, las obligaciones aplicables y los registros relacionados."],
      ["Bazi y servicios opcionales", "Bazi puede utilizar Google Gemini para responder consultas con los datos necesarios del negocio y las funciones permitidas por tu rol. Antes de enviar una consulta al modelo se solicita permiso en su interfaz. El contenido enviado queda sujeto al tratamiento del proveedor según el servicio configurado. No incluyas información sensible innecesaria ni datos que no estés autorizado a compartir. Las propuestas que cambian registros se revisan antes de confirmarse. La disponibilidad depende de la conexión y de los límites del proveedor."],
      ["Marco y actualización", "Esta información toma como referencia la Ley N.º 29733 y su Reglamento aprobado por Decreto Supremo N.º 016-2024-JUS. La fecha identifica la versión de la política que acompaña al consentimiento. Cualquier finalidad nueva debe informarse antes de utilizar los datos para ella."],
    ],
  },
  cookies: {
    title: "Política de cookies",
    intro: "Información sobre las cookies, almacenamiento local y servicios externos de MiBazarPE.",
    sections: [
      ["Qué son", "Las cookies son pequeños datos que el navegador conserva para permitir determinadas funciones de un sitio. El almacenamiento local cumple una función similar, pero no se transmite automáticamente con cada petición."],
      ["Autenticación necesaria", "El área privada utiliza cookies de sesión de Supabase para mantener el acceso autenticado y renovar la sesión. Sus nombres dependen del proyecto y suelen comenzar por sb-. Los tokens de acceso caducan y la sesión puede renovarse mientras siga activa. Cerrar sesión elimina el acceso local; también puedes eliminar los datos del sitio desde el navegador."],
      ["Verificación de seguridad", "Los formularios protegidos pueden cargar hCaptcha, que procesa señales técnicas y puede utilizar almacenamiento o cookies propios para detectar abuso. Esa verificación se utiliza para proteger el envío y el acceso. Si no deseas utilizar ese formulario, puedes contactarnos directamente por correo o teléfono."],
      ["Analítica y publicidad", "Esta versión no incorpora cookies publicitarias ni herramientas de analítica de marketing propias. No se activa una categoría de publicidad mediante la aceptación del formulario. Si más adelante se incorporan tecnologías opcionales, se informará su finalidad y se habilitará su elección antes de activarlas cuando corresponda."],
      ["Servicios externos", "La sección de contacto incorpora Google Maps para mostrar San Isidro, Lima, Perú. El mapa se carga de forma diferida al aproximarte a esa sección; Google puede recibir información técnica y utilizar cookies según su propia política. Los enlaces a WhatsApp y redes sociales no incrustan sus páginas en el sitio. Al abrirlos, esos servicios pueden utilizar cookies según sus propias políticas. Puedes bloquear cookies de terceros desde tu navegador y contactar por correo o teléfono sin utilizar el mapa."],
      ["Cómo gestionarlas", "Puedes consultar y borrar cookies y almacenamiento desde la configuración de privacidad del navegador, bloquear cookies de terceros o utilizar una ventana privada. Bloquear datos necesarios puede impedir mantener la sesión o completar la verificación. Estas opciones no sustituyen cerrar sesión cuando utilizas un equipo compartido."],
      ["Más información", `Para consultas sobre cookies o datos personales, escribe a ${marketingContact.email}. Revisa también la política de privacidad para conocer finalidades y derechos.`],
    ],
  },
} as const;

type DocumentName = keyof typeof documents;
function findDocument(name: string) { return Object.hasOwn(documents, name) ? documents[name as DocumentName] : null; }
export async function generateMetadata({ params }: { params: Promise<{ documento: string }> }): Promise<Metadata> {
  const doc = findDocument((await params).documento);
  return { title: doc ? `${doc.title} | MiBazarPE` : "Documento no encontrado" };
}
export default async function LegalPage({ params }: { params: Promise<{ documento: string }> }) {
  const { documento } = await params;
  const doc = findDocument(documento);
  if (!doc) notFound();
  return <><main className={styles.page}>
    <Link href="/" className={styles.back}>← Volver a MiBazarPE</Link>
    <header><p className={styles.eyebrow}>INFORMACIÓN LEGAL · VERSIÓN 23 OCT 2026</p><h1>{doc.title}</h1><p>{doc.intro}</p></header>
    <nav className={styles.tabs} aria-label="Documentos legales">{legalLinks.map(([title, href]) => <Link key={href} href={href} aria-current={href.endsWith(documento) ? "page" : undefined}>{title}</Link>)}</nav>
    <article className={styles.document}>{doc.sections.map(([title, text], i) => <section key={title}><h2>{i + 1}. {title}</h2><p>{text}</p></section>)}</article>
    <aside className={styles.sources}><h2>Fuentes y servicios relacionados</h2><a href="https://www.gob.pe/anpd" target="_blank" rel="noopener noreferrer">Autoridad Nacional de Protección de Datos Personales ↗</a><a href="https://www3.congreso.gob.pe/Docs/DGP/DIDP/files/ds_016-2024-jus.pdf" target="_blank" rel="noopener noreferrer">Reglamento de la Ley N.º 29733 ↗</a><a href="https://www.brevo.com/legal/privacypolicy/" target="_blank" rel="noopener noreferrer">Privacidad de Brevo ↗</a><a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener noreferrer">Privacidad de hCaptcha ↗</a><a href="https://policies.google.com/privacy?hl=es" target="_blank" rel="noopener noreferrer">Privacidad de Google ↗</a><a href={`mailto:${marketingContact.email}`}>Contactar al responsable</a></aside>
  </main><Footer /></>;
}

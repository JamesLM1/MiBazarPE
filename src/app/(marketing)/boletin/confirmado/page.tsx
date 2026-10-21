import Link from "next/link";
import { Footer } from "@/components/marketing/footer";
export const metadata = { title: "Confirmación del boletín | MiBazarPE", robots: { index: false } };
export default function Page() {
  return <><main className="mx-auto my-24 max-w-2xl px-6"><p className="text-sm text-primary">NOVEDADES DE MIBAZARPE</p><h1 className="mt-4 text-4xl font-semibold">Gracias por confirmar tu correo</h1><p className="mt-6 leading-7 text-muted-foreground">Si llegaste desde el enlace de confirmación de Brevo, tu suscripción se ha tramitado allí. Abrir esta página por sí sola no suscribe ninguna dirección.</p><p className="mt-4 leading-7 text-muted-foreground">Puedes cancelar la suscripción desde cualquier boletín o escribiendo al contacto de MiBazarPE.</p><Link href="/" className="mt-8 inline-flex min-h-11 items-center text-primary underline">Volver a MiBazarPE</Link></main><Footer /></>;
}

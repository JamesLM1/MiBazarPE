import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section
        aria-labelledby="visual-check-title"
        className="w-full max-w-xl rounded-xl border bg-card p-6 text-card-foreground sm:p-10"
      >
        <Image
          src="/brand/mibazarpe-logo.png"
          alt="MiBazarPE"
          width={2172}
          height={724}
          unoptimized
          className="mb-8 h-auto w-72 max-w-full"
        />
        <h1 id="visual-check-title" className="text-2xl font-semibold tracking-tight">
          Sistema visual base
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Vista de prueba del tema oscuro, el logo y los botones. La aplicación
          está en preparación.
        </p>
        <div aria-label="Variantes de botón de muestra" className="mt-8 flex flex-wrap gap-3">
          <Button type="button">Primario</Button>
          <Button type="button" variant="secondary">Secundario</Button>
          <Button type="button" variant="outline">Contorno</Button>
          <Button type="button" disabled>Deshabilitado</Button>
        </div>
      </section>
    </main>
  );
}

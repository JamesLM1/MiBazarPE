import { AuthRoute } from "@/components/auth/auth-route";
export const metadata = { title: "Iniciar sesión | MiBazarPE" };
export default async function Login({ searchParams }: { searchParams: Promise<{ verified?: string; error?: string }> }) {
  const params = await searchParams;
  const notice = params.error ? "El enlace no se pudo validar o ya venció. Solicita uno nuevo desde recuperación de contraseña." : params.verified ? "Correo confirmado. Ya puedes acceder a MiBazarPE." : undefined;
  return <AuthRoute mode="login" notice={notice} />;
}

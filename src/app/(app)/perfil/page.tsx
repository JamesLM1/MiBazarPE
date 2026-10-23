import { RevealHeading } from "@/components/app-shell/reveal-heading";
import { UserRound } from "lucide-react";
import { getPrivateContext } from "@/features/dashboard/context";
import { displayRole } from "@/features/dashboard/model";
import styles from "@/components/app-shell/dashboard.module.css";
import formStyles from "@/components/app-shell/operations.module.css";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import { AccessForm } from "@/components/app-shell/access-form";
import { saveProfile } from "@/features/access/actions";
export const metadata = { title: "Mi perfil" };
export default async function ProfilePage() {
  const { user, business } = await getPrivateContext();
  const db=await getSupabaseServerClient();
  const {data:profile,error}=await db.from('perfiles').select('tipo_documento,numero_documento,telefono').eq('id',user.id).maybeSingle();
  const needsBusiness = !business && user.role !== "CLIENTE";
  return <section className={formStyles.page}><header className={formStyles.heading}><div><UserRound size={28}/><RevealHeading>Mi perfil</RevealHeading><p>Tu identidad y tus datos de contacto.</p></div></header><section className={formStyles.formCard}><dl className={styles.profileDetails}><dt>Correo</dt><dd>{user.email || "No disponible"}</dd><dt>Rol</dt><dd>{displayRole(user.role)}</dd><dt>Negocio</dt><dd>{business?.name ?? "Sin bazar seleccionado"}</dd></dl>{error?<p role="alert">No pudimos cargar tu perfil. Vuelve a intentarlo.</p>:<AccessForm action={saveProfile} label={needsBusiness?"Guardar perfil y crear mi negocio":"Guardar perfil"}>{needsBusiness&&<><input type="hidden" name="continue" value="create-business"/><p className={formStyles.formHint}>Esta cuenta es para administrar tu bazar. Completa tu identidad y después registra el establecimiento. Los clientes acceden mediante una invitación del negocio.</p></>}<label>Nombre completo<input name="name" required minLength={3} maxLength={120} defaultValue={user.name}/></label><label>Celular<input name="phone" pattern="9[0-9]{8}" maxLength={9} defaultValue={profile?.telefono??''}/></label><label>Tipo de documento<select name="document_type" defaultValue={profile?.tipo_documento??'DNI'} disabled={!!profile}><option>DNI</option><option>RUC</option></select>{profile&&<input type="hidden" name="document_type" value={profile.tipo_documento}/>}</label><label>Número de documento<input name="document" required inputMode="numeric" pattern="[0-9]{8}|[0-9]{11}" defaultValue={profile?.numero_documento??''} readOnly={!!profile}/></label><p className={formStyles.formHint}>El documento identifica tu cuenta y se conserva después del registro. Si recibiste una invitación de cliente, acéptala antes de crear un perfil de dueño.</p></AccessForm>}</section></section>;
}

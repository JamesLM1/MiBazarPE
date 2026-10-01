import Image from "next/image";
import styles from "./team.module.css";

type Network = "GitHub" | "LinkedIn" | "Instagram";

const members = [
  { name: "James Lucas Moreto", role: "Líder del Proyecto & Full Stack Developer", photo: "james-lucas-moreto", socials: [["GitHub", "https://github.com/JamesLM1"], ["LinkedIn", "https://www.linkedin.com/in/james-lucas-moreto/"], ["Instagram", "https://www.instagram.com/esjam_lm/"]] },
  { name: "Jairo Jalil Antonino Rodriguez Espinoza", role: "Desarrollo de Software", photo: "jairo-rodriguez-espinoza", socials: [["GitHub", "https://github.com/JJARE1611"], ["LinkedIn", "https://www.linkedin.com/in/jairo-rodriguez-espinoza/"]] },
  { name: "Luis Diego Camus Dominguez", role: "Diseño UI/UX & Prototipado", photo: "luis-diego-camus-dominguez", socials: [["GitHub", "https://github.com/LuisCamus19"], ["LinkedIn", "https://www.linkedin.com/in/camius/"]] },
  { name: "Diego Alexander Aguirre Gutierrez", role: "Documentación Técnica", photo: "diego-alexander-aguirre-gutierrez", socials: [["LinkedIn", "https://www.linkedin.com/in/diegoaguirre192/"]] },
  { name: "Oscar Enrique Valderrama Bautista", role: "Documentación Funcional", photo: "oscar-enrique-valderrama-bautista", socials: [["GitHub", "https://github.com/OscarV123/OscarV123"], ["LinkedIn", "https://www.linkedin.com/in/oscar-valderrama-bautista/"]] },
  { name: "Alex Oswaldo Villarroel Antonio", role: "Coordinación del Proyecto", photo: null, socials: [] },
] satisfies { name: string; role: string; photo: string | null; socials: [Network, string][] }[];

// Brand marks drawn locally: this lucide-react version does not include brand icons.
function SocialIcon({ network }: { network: Network }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false">
      {network === "GitHub" && <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />}
      {network === "LinkedIn" && <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5V9h3ZM6.5 7.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4ZM19 19h-3v-5.2c0-1.3-.5-2-1.5-2-1.1 0-1.7.8-1.7 2V19H10V9h2.8v1.4c.6-1 1.6-1.7 3-1.7 2.3 0 3.2 1.4 3.2 4Z" />}
      {network === "Instagram" && <g fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></g>}
    </svg>
  );
}

export function Team() {
  return (
    <section id="nosotros" className={styles.section} aria-labelledby="team-heading">
      <div className={styles.container}>
        <div className={styles.introduction}>
          <p className={styles.eyebrow}>HECHO POR</p>
          <p className={styles.statement}><span>Las personas que aparecen a continuación</span> dieron forma a MiBazarPE de manera conjunta, trabajando como un solo equipo en las áreas de <span>desarrollo, diseño, documentación y coordinación.</span></p>
        </div>
        <h2 id="team-heading" className={styles.heading}>El equipo detrás<br />de MiBazarPE</h2>
        <div className={styles.composition}>
          <div className={styles.mosaic} aria-label="Retratos del equipo de MiBazarPE">
            {[[0, 3], [2, 4], [1, 5]].map((column, index) => (
              <div className={styles.photoColumn} key={index}>
                {column.map((memberIndex) => {
                  const member = members[memberIndex];
                  return <div className={styles.portrait} key={member.name}>
                    {member.photo ? <Image src={`/team/${member.photo}.webp`} alt={`Retrato de ${member.name}`} fill sizes="(max-width: 639px) 31vw, (max-width: 959px) 28vw, 180px" /> : <div className={styles.placeholder} role="img" aria-label="Alex Oswaldo Villarroel Antonio: fotografía pendiente"><span>AV</span><small>Alex Villarroel</small></div>}
                  </div>;
                })}
              </div>
            ))}
          </div>
          <ul className={styles.members} aria-label="Integrantes y créditos del equipo">
            {members.map((member) => <li className={styles.member} key={member.name}>
              <div className={styles.credit}><h3>{member.name}</h3><p>{member.role}</p></div>
              {member.socials.length > 0 && <div className={styles.socials}>{member.socials.map(([network, url]) => <a key={network} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} en ${network} (abre en una nueva pestaña)`}><SocialIcon network={network} /></a>)}</div>}
            </li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Public business channels. Never place provider credentials in this module.
export const marketingContact = {
  phone: "+51 913 411 464",
  phoneHref: "tel:+51913411464",
  whatsapp: "https://wa.me/51913411464?text=Hola%2C%20quisiera%20informaci%C3%B3n%20sobre%20MiBazarPE.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contacto.mibazarpe@gmail.com",
  responsible: "James Lucas Moreto",
} as const;

export const legalLinks = [
  ["Términos y condiciones", "/legal/terminos"],
  ["Política de privacidad", "/legal/privacidad"],
  ["Política de cookies", "/legal/cookies"],
] as const;

// Public channel links created for the project or explicitly provided by its owner.
export const companySocialUrls: Record<string, string | undefined> = {
  X: process.env.NEXT_PUBLIC_SOCIAL_X || "https://x.com/MiBazarpe",
  LinkedIn: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || "https://www.linkedin.com/company/mibazarpe/",
  Discord: process.env.NEXT_PUBLIC_SOCIAL_DISCORD || "https://discord.gg/xJ6pjfxAb",
  YouTube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "https://www.youtube.com/@MiBazarPE",
  Facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "https://www.facebook.com/profile.php?id=61595385188060",
  Instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "https://www.instagram.com/esjam_lm/",
};

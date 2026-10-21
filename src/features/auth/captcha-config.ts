// Next.js statically embeds these public values; never put a secret here.
// Keeping Turnstile until the hCaptcha sitekey is configured allows an atomic
// cutover with Supabase's provider setting without disabling CAPTCHA.
export const captchaConfig = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
  ? { provider: "hcaptcha" as const, sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY }
  : { provider: "turnstile" as const, sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY };

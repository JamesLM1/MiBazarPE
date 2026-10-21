import type { CaptchaFailure } from "./captcha";

type HcaptchaOptions = {
  sitekey: string;
  theme: "dark";
  size: "normal" | "compact";
  hl: "es";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "chalexpired-callback": () => void;
  "close-callback": () => void;
};

export type Hcaptcha = {
  render: (element: HTMLElement, options: HcaptchaOptions) => string;
  remove: (id: string) => void;
};

// Tokens belong to one mounted form. Errors, expiry and a closed challenge
// invalidate them; callbacks from a removed widget must never restore one.
export function mountHcaptcha(api: Hcaptcha, element: HTMLElement, sitekey: string,
  onToken: (token: string) => void, onError: (reason: CaptchaFailure) => void) {
  let active = true;
  let id: string | undefined;
  const token = (value: string) => { if (active) onToken(value); };
  const fail = (reason: CaptchaFailure) => {
    if (!active) return;
    onToken("");
    onError(reason);
  };
  try {
    id = api.render(element, {
      sitekey, theme: "dark", size: element.clientWidth < 304 ? "compact" : "normal", hl: "es",
      callback: token,
      "expired-callback": () => token(""),
      "error-callback": () => fail("unavailable"),
      "chalexpired-callback": () => fail("timeout"),
      "close-callback": () => token(""),
    });
  } catch {
    fail("unavailable");
    active = false;
  }
  return () => {
    active = false;
    if (id !== undefined) {
      try { api.remove(id); } catch { /* Navigation must survive SDK cleanup failures. */ }
      id = undefined;
    }
  };
}

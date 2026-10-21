export type CaptchaFailure = "unavailable" | "timeout" | "unsupported";

type WidgetOptions = {
  sitekey: string;
  theme: "auto";
  size: "flexible";
  language: "es";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
  "unsupported-callback": () => void;
};

export type Turnstile = {
  render: (element: HTMLElement, options: WidgetOptions) => string;
  remove: (id: string) => void;
};

// Ignore callbacks from a previous form after navigation or a new submission.
export function mountCaptcha(api: Turnstile, element: HTMLElement, sitekey: string,
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
      sitekey, theme: "auto", size: "flexible", language: "es",
      callback: token,
      "expired-callback": () => token(""),
      "error-callback": () => fail("unavailable"),
      "timeout-callback": () => fail("timeout"),
      "unsupported-callback": () => fail("unsupported"),
    });
  } catch {
    fail("unavailable");
    active = false;
  }
  return () => {
    active = false;
    if (id !== undefined) {
      // Cleanup must not break navigation if the provider has already removed it.
      try { api.remove(id); } catch { /* The form is already unmounted. */ }
      id = undefined;
    }
  };
}

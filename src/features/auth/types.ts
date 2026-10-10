export type AuthMode = "login" | "register" | "recover" | "reset";
export type AuthMascotState = "idle" | "email" | "password" | "password-visible" | "loading" | "success" | "error";
export type AuthFields = { name: string; email: string; password: string; confirmation: string };
export type AuthFieldErrors = Partial<Record<keyof AuthFields, string>>;

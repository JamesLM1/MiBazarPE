import "server-only";
import type { BaziHistoryMessage } from "./types";

export type GeminiTool = { type: "function"; name: string; description: string; parameters: Record<string, unknown> };
type Step = Record<string, unknown> & { type: string };
type Interaction = { steps?: Step[]; output_text?: string; status?: string };
export function geminiConfiguration() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim();
  return { key, model: model && /^[a-zA-Z0-9._-]{1,100}$/.test(model) ? model : undefined };
}
function outputText(interaction: Interaction) {
  if (typeof interaction.output_text === "string") return interaction.output_text;
  return (interaction.steps ?? []).flatMap(step => {
    if (step.type === "text" && typeof step.text === "string") return [step.text];
    if (step.type === "model_output") {
      if (typeof step.content === "string") return [step.content];
      if (Array.isArray(step.content)) return step.content.filter(c => c?.type === "text" && typeof c.text === "string").map(c => c.text);
    }
    return [];
  }).join("\n");
}
export async function askGemini(options: {
  key: string; model: string; message: string; history: BaziHistoryMessage[]; instructions: string;
  tools: GeminiTool[]; run: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}, request: typeof fetch = fetch) {
  const input: Step[] = options.history.map(item => item.role === "user"
    ? { type: "user_input", content: item.text }
    : { type: "model_output", content: [{ type: "text", text: item.text }] });
  input.push({ type: "user_input", content: options.message });
  const allowed = new Set(options.tools.map(tool => tool.name));
  // Leave time to return a useful error before the host's 60-second request limit.
  const signal = AbortSignal.timeout(45000);
  let calls = 0;
  for (let round = 0; round < 4; round++) {
    const response = await request("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": options.key },
      cache: "no-store", signal,
      body: JSON.stringify({ model: options.model, store: false, input, system_instruction: options.instructions,
        tools: options.tools, generation_config: { max_output_tokens: 2500 } }),
    });
    if (!response.ok) throw new Error(response.status === 429 ? "Gemini alcanzó su límite de uso. Inténtalo más tarde." : response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 ? "Revisa la clave, el modelo habilitado y los permisos de Gemini en la configuración privada." : "Gemini no está disponible. Puedes seguir usando las consultas directas.");
    const interaction = await response.json() as Interaction;
    if (!Array.isArray(interaction.steps) || interaction.steps.length > 40) throw new Error("Gemini no devolvió una respuesta utilizable.");
    const pending = interaction.steps.filter(step => step.type === "function_call");
    if (!pending.length) {
      const text = outputText(interaction).trim();
      if (!text) throw new Error("Gemini no generó una respuesta. Inténtalo con una petición más concreta.");
      return text.slice(0, 12000);
    }
    input.push(...interaction.steps);
    for (const call of pending) {
      if (++calls > 6) throw new Error("La petición requiere demasiados pasos. Divide la tarea en partes.");
      const name = typeof call.name === "string" ? call.name : "";
      if (!allowed.has(name) || typeof call.id !== "string") throw new Error("Gemini solicitó una herramienta que no está habilitada.");
      const args = call.arguments && typeof call.arguments === "object" && !Array.isArray(call.arguments) ? call.arguments as Record<string, unknown> : {};
      let result: unknown;
      try { result = await options.run(name, args); }
      catch (error) { result = { error: error instanceof Error ? error.message : "No se pudo consultar la herramienta." }; }
      input.push({ type: "function_result", name, call_id: call.id, result: [{ type: "text", text: JSON.stringify(result) }] });
    }
  }
  throw new Error("No se completó la petición en los pasos disponibles. Las propuestas no se han confirmado.");
}

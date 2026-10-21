import type { CreditPlan } from "@/features/operations/actions";

export type BaziIntent = "summary" | "sales" | "inventory" | "due" | "account" | "help";
export type BaziCard = {
  id: string; title: string; caption: string; kind: "metrics" | "table" | "chart" | "note";
  metrics?: { label: string; value: string }[];
  columns?: string[]; rows?: string[][];
  points?: { label: string; amount: number }[];
  links?: { label: string; href: string }[];
};
export type BaziProposal = {
  id: string; title: string; detail: string; token: string;
  changes: { label: string; before: string; after: string }[];
  plan?: CreditPlan; expiresAt?: string;
};
export type BaziReply = { text: string; cards: BaziCard[]; proposals: BaziProposal[]; source: "direct" | "gemini"; error?: string };
export type BaziBootstrap = {
  scope: string; name: string; business: string; role: string; isClient: boolean; canManage: boolean;
  configured: boolean; model: string | null; isDemo: boolean; accessible: boolean;
  greeting: BaziReply; generatedAt: string; saved: BaziStoredWorkspace; savedVersion: number; persistenceError?: string;
};
export type BaziHistoryMessage = { role: "user" | "assistant"; text: string };
export type BaziRequest = { scope: string; message?: string; intent?: BaziIntent; shareWithGemini?: boolean; history?: BaziHistoryMessage[] };

export type BaziExchange = { id: string; question: string; reply: BaziReply };
export type BaziThread = { id: string; title: string; exchanges: BaziExchange[] };
export type BaziProposalState = { status: "pending" | "saving" | "done" | "canceled"; message?: string };
export type BaziActivity = { id: string; title: string; detail: string; time: string };
export type BaziStoredWorkspace = { schema: 1; threads: BaziThread[]; current: string; external: boolean; states: Record<string, BaziProposalState>; activity: BaziActivity[] };
export type BaziRoutineInput = { id?: string; title: string; kind: "STOCK" | "VENCIMIENTOS" | "MI_CUENTA"; frequency: "DIARIA" | "SEMANAL"; day: number; time: string };
export type BaziRoutine = BaziRoutineInput & { id: string; active: boolean; archived: boolean; next: string };
export type BaziMemory = { id: string; title: string; content: string; active: boolean; updated: string };
export type BaziRun = { id: string; routine: string; time: string; status: string; metrics: { label: string; value: string }[]; note: string };
export type BaziResources = { routines: BaziRoutine[]; memories: BaziMemory[]; runs: BaziRun[]; error?: string };

import { handleMarketing } from "@/features/marketing/handler";
export const runtime = "nodejs";
export async function POST(request: Request) { return handleMarketing(request, "newsletter"); }

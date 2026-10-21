import { OperationsPage } from "@/components/app-shell/operations-page";
export const metadata = { title: "Ventas" };
export default async function Page({searchParams}:{searchParams:Promise<{page?:string;q?:string}>}) { return <OperationsPage query={await searchParams} kind="ventas" />; }

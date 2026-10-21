import { OperationsPage } from "@/components/app-shell/operations-page";
export const metadata = { title: "Pagos y cobros" };
export default async function Page({searchParams}:{searchParams:Promise<{page?:string;q?:string}>}) { return <OperationsPage query={await searchParams} kind="pagos" />; }

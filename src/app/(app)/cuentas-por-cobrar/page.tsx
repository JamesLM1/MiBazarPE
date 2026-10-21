import { OperationsPage } from "@/components/app-shell/operations-page";
export const metadata = { title: "Cuentas por cobrar" };
export default async function Page({searchParams}:{searchParams:Promise<{page?:string;q?:string}>}) { return <OperationsPage query={await searchParams} kind="cuentas-por-cobrar" />; }

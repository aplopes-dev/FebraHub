import { BankStatementDetailPage } from "@/features/bank-reconciliation";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BankStatementDetailPage bankStatementId={id} />;
}

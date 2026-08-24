import { SalesContractEditPage } from "@/features/sales-contracts";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <SalesContractEditPage contractId={id} />;
}

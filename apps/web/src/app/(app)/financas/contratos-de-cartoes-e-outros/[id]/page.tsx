import { CardContractEditPage } from "@/features/card-contracts";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CardContractEditPage contractId={id} />;
}

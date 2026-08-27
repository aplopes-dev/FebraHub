import { StockBalancePage } from "@/features/stock";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <StockBalancePage stockId={id} />;
}

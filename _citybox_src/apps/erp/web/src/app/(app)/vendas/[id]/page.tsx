import { SaleEditPage } from "@/features/sales";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <SaleEditPage saleId={id} />;
}

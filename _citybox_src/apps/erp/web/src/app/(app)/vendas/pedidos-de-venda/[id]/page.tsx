import { SaleOrderEditPage } from "@/features/sales-orders";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <SaleOrderEditPage orderId={id} />;
}

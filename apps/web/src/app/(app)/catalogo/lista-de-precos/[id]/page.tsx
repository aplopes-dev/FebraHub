import { PriceListDetailPage } from "@/features/price-lists";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PriceListDetailPage priceListId={id} />;
}

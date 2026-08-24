import { StoreDetailRoute } from "@/features/stores/components/store-detail/store-detail-route";

interface StoreDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { id } = await params;
  return <StoreDetailRoute id={id} />;
}

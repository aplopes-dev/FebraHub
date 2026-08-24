import { InventoryDetailPage } from "@/features/stock-inventory";

type PageProps = {
  params: Promise<{ id: string; inventoryId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id, inventoryId } = await params;
  return <InventoryDetailPage stockId={id} inventoryId={inventoryId} />;
}

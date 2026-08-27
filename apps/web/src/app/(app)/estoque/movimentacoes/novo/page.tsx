import { StockMovementCreatePage } from "@/features/stock-movements";
import type { StockMovementType } from "@/features/stock-movements/types/stock-movement";

type PageProps = {
  searchParams: Promise<{ type?: string; estoque?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { type, estoque } = await searchParams;
  const initialType: StockMovementType | undefined =
    type === "entrada" || type === "saida" ? type : undefined;

  return (
    <StockMovementCreatePage
      initialType={initialType}
      initialWarehouseId={estoque}
    />
  );
}

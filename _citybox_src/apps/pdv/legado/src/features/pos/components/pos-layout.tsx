"use client";

import type { StoreSummary } from "@/features/shared";
import { CatalogPanel } from "./catalog-panel";
import { OrderPanel } from "./order-panel";
import { PosHeader } from "./pos-header";
import { PosSideMenu } from "./pos-side-menu";

type PosLayoutProps = {
  store: StoreSummary;
};

/**
 * Layout principal do PDV: coluna do catálogo (header + itens) + coluna do pedido.
 */
export function PosLayout({ store }: PosLayoutProps) {
  return (
    <div className="flex h-full min-h-0 w-full">
      <PosSideMenu store={store} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PosHeader />
        <CatalogPanel />
      </div>
      <div className="hidden w-full max-w-[336px] shrink-0 md:block">
        <OrderPanel />
      </div>
    </div>
  );
}

"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import { centsToReais } from "@/features/products/api/product.mapper";
import type { ProductAddonListResponseDto } from "./product.dto";
import type { ProductAddonOption } from "@/features/products/types/product-addons";

export async function listProductAddons(): Promise<ProductAddonOption[]> {
  const response = await comercioFetch<ProductAddonListResponseDto>(
    "/v1/product-addons",
  );

  return response.data.map((addon) => ({
    id: addon.id,
    name: addon.name,
    defaultPrice: centsToReais(addon.defaultPriceCents),
  }));
}
